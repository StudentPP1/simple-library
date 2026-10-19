"""Спільні фікстури для системних (E2E) тестів Simple Library на Selenium."""
import itertools
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import pytest
from selenium import webdriver
from selenium.common.exceptions import StaleElementReferenceException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_TIMEOUT = 10


def pytest_addoption(parser):
    parser.addoption("--browser", default="chrome", choices=["chrome", "firefox", "edge"],
                     help="Браузер для запуску тестів (NFR-6)")
    parser.addoption("--base-url", default=os.getenv("E2E_BASE_URL", "http://localhost:3000"))
    parser.addoption("--api-url", default=os.getenv("E2E_API_URL", "http://127.0.0.1:5000/api"))
    parser.addoption("--headed", action="store_true", help="Показувати вікно браузера")
    parser.addoption("--remote-url", default=os.getenv("SELENIUM_REMOTE_URL"),
                     help="Адреса Selenium Grid/контейнера, напр. http://localhost:4444")
    parser.addoption("--browser-arg", action="append", default=[],
                     help="Додатковий аргумент браузера (можна вказати кілька разів)")


def _read_env_file():
    env_file = REPO_ROOT / ".env"
    if not env_file.exists():
        return {}
    pairs = (line.split("=", 1) for line in env_file.read_text(encoding="utf-8").splitlines()
             if "=" in line and not line.lstrip().startswith("#"))
    return {k.strip(): v.strip() for k, v in pairs}


@pytest.fixture(scope="session")
def browser_name(request):
    return request.config.getoption("--browser")


@pytest.fixture(scope="session")
def base_url(request):
    return request.config.getoption("--base-url").rstrip("/")


@pytest.fixture(scope="session")
def librarian_code():
    code = os.getenv("LIBRARIAN_CODE") or _read_env_file().get("LIBRARIAN_INVITE_CODE")
    if not code:
        pytest.fail("Задайте LIBRARIAN_CODE або LIBRARIAN_INVITE_CODE у .env")
    return code


class Api:
    """Мінімальний клієнт API для підготовки тестових даних (не те, що перевіряємо через UI)."""

    def __init__(self, base):
        self.base = base

    def call(self, method, path, body=None, token=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, data=data, method=method)
        req.add_header("Content-Type", "application/json")
        if token:
            req.add_header("Authorization", f"Bearer {token}")
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return json.loads(resp.read() or b"null")
        except urllib.error.HTTPError as e:
            raise AssertionError(f"{method} {path} -> {e.code}: {e.read().decode(errors='replace')}") from e

    def register(self, full_name, email, password, librarian_code=None):
        body = {"fullName": full_name, "email": email, "password": password}
        if librarian_code:
            body["librarianSecretCode"] = librarian_code
        return self.call("POST", "/auth/register", body)["data"]

    def login(self, email, password):
        return self.call("POST", "/auth/login", {"email": email, "password": password})["data"]

    def add_book(self, token, **fields):
        body = {"title": "", "author": "Selenium Автор", "genre": "E2E", "isbn": "978-0000000001",
                "description": "Книга для системного тестування", "publicationYear": 2021, "copiesCount": 2}
        body.update(fields)
        return self.call("POST", "/books", body, token)["data"]

    def reserve(self, token, book_id):
        return self.call("POST", "/loans/reserve", {"bookId": book_id}, token)["data"]


@pytest.fixture(scope="session")
def api(request):
    return Api(request.config.getoption("--api-url").rstrip("/"))


@pytest.fixture(scope="session")
def run_id(browser_name):
    return f"{browser_name}{int(time.time() * 1000) % 10**9}"


_counter = itertools.count(1)


@pytest.fixture
def unique(run_id):
    """Унікальний префікс для даних конкретного тесту."""
    return f"{run_id}-{next(_counter)}"


@pytest.fixture(scope="session")
def librarian(api, run_id, librarian_code):
    email, password = f"lib.{run_id}@test.local", "Passw0rd-e2e"
    api.register("E2E Бібліотекар", email, password, librarian_code)
    return {"email": email, "password": password, "token": api.login(email, password)}


@pytest.fixture
def reader(api, unique):
    email, password = f"reader.{unique}@test.local", "Passw0rd-e2e"
    api.register(f"E2E Читач {unique}", email, password)
    return {"email": email, "password": password, "token": api.login(email, password)}


@pytest.fixture
def book(api, librarian, unique):
    return api.add_book(librarian["token"], title=f"E2E книга {unique}")


def _make_driver(name, headed, remote_url, extra_args):
    if name == "chrome":
        opts = webdriver.ChromeOptions()
    elif name == "edge":
        opts = webdriver.EdgeOptions()
        if sys.platform.startswith("linux") and not remote_url:
            # Ubuntu 24.04: AppArmor не дає Edge створити sandbox -> "Chrome instance exited"
            opts.add_argument("--no-sandbox")
            opts.add_argument("--disable-dev-shm-usage")
    else:
        opts = webdriver.FirefoxOptions()

    if not headed:
        opts.add_argument("-headless" if name == "firefox" else "--headless=new")
    if name != "firefox":
        opts.add_argument("--window-size=1366,900")
    for arg in extra_args:
        opts.add_argument(arg)

    if remote_url:
        # Браузер в офіційному контейнері Selenium (так запускається Edge у CI)
        driver = webdriver.Remote(command_executor=remote_url, options=opts)
    else:
        driver = {"chrome": webdriver.Chrome, "edge": webdriver.Edge, "firefox": webdriver.Firefox}[name](options=opts)
    driver.set_window_size(1366, 900)
    return driver


@pytest.fixture(scope="session")
def _session_driver(browser_name, request):
    cfg = request.config
    drv = _make_driver(browser_name, cfg.getoption("--headed"), cfg.getoption("--remote-url"),
                       cfg.getoption("--browser-arg"))
    drv.implicitly_wait(0)
    # Без цього зависла сторінка блокує тест на 5 хвилин (стандартний таймаут Selenium)
    drv.set_page_load_timeout(30)
    drv.set_script_timeout(30)
    yield drv
    drv.quit()


@pytest.fixture
def driver(_session_driver, base_url):
    """Один браузер на весь прогін; між тестами очищаємо сесію, щоб тести не залежали один від одного."""
    yield _session_driver
    try:
        _session_driver.switch_to.alert.dismiss()
    except Exception:
        pass
    _session_driver.get(base_url + "/login")
    _session_driver.execute_script("localStorage.clear(); sessionStorage.clear();")
    _session_driver.delete_all_cookies()
    _session_driver.set_window_size(1366, 900)


@pytest.fixture
def ui(driver, base_url):
    return Ui(driver, base_url)


class Ui:
    """Допоміжні дії над інтерфейсом, щоб тести читалися як сценарії користувача."""

    def __init__(self, driver, base_url):
        self.driver = driver
        self.base_url = base_url
        # React перемальовує список після кожного запиту — елемент може «застаріти» між пошуком і читанням
        self.wait = WebDriverWait(driver, DEFAULT_TIMEOUT, ignored_exceptions=[StaleElementReferenceException])

    def open(self, path):
        self.driver.get(self.base_url + path)

    def login_with_token(self, token, path="/dashboard"):
        """Вхід без UI-форми: кладемо JWT так само, як це робить сторінка Login."""
        self.open("/login")
        self.driver.execute_script(
            "localStorage.setItem('jwt_token', arguments[0]); localStorage.setItem('token', arguments[0]);", token)
        self.open(path)

    def el(self, by, value):
        return self.wait.until(EC.visibility_of_element_located((by, value)))

    def clickable(self, by, value):
        return self.wait.until(EC.element_to_be_clickable((by, value)))

    def by_placeholder(self, placeholder):
        return self.el(By.CSS_SELECTOR, f"input[placeholder='{placeholder}'], textarea[placeholder='{placeholder}']")

    def button(self, text, scope="//"):
        return self.clickable(By.XPATH, f"{scope}button[contains(normalize-space(.), {xpath_literal(text)})]")

    def text_visible(self, text):
        return self.el(By.XPATH, f"//*[contains(normalize-space(text()), {xpath_literal(text)})]")

    def find_book(self, title):
        """Знаходить книгу в каталозі через пошук (каталог вантажиться сторінками по 20 книг)."""
        self.open("/catalog")
        self.type_into(self.by_placeholder("Пошук за назвою або автором..."), title)
        return self.card(title)

    def card(self, title):
        """Картка книги в каталозі за назвою."""
        return self.el(By.XPATH, f"//h3[normalize-space(.)={xpath_literal(title)}]/ancestor::div[contains(@class,'rounded-2xl')][1]")

    def row(self, text):
        """Рядок таблиці, що містить текст."""
        return self.el(By.XPATH, f"//tr[.//*[contains(normalize-space(.), {xpath_literal(text)})]]")

    def wait_url(self, path):
        self.wait.until(EC.url_contains(path))

    def type_into(self, element, text):
        element.clear()
        element.send_keys(text)


def xpath_literal(s):
    if "'" not in s:
        return f"'{s}'"
    if '"' not in s:
        return f'"{s}"'
    return "concat('" + s.replace("'", "', \"'\", '") + "')"


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Скриншот при падінні тесту — для звіту про знайдені помилки."""
    outcome = yield
    report = outcome.get_result()
    if report.when == "call" and report.failed and "driver" in item.fixturenames:
        drv = item.funcargs["driver"]
        shots = REPO_ROOT / "tests" / "e2e" / "screenshots"
        shots.mkdir(exist_ok=True)
        try:
            drv.save_screenshot(str(shots / f"{item.name}.png"))
        except Exception as e:
            # Зависший браузер не повинен обривати весь прогін (INTERNALERROR)
            report.sections.append(("screenshot", f"Не вдалося зберегти скриншот: {e.__class__.__name__}"))
