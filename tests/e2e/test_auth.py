"""FR-1, FR-11: реєстрація, вхід, вихід і розмежування доступу за ролями."""
from selenium.webdriver.common.by import By


def test_reader_registers_and_logs_in(ui, unique):
    email, password = f"ui.{unique}@test.local", "Passw0rd-ui"

    ui.open("/register")
    ui.type_into(ui.by_placeholder("Іванов Іван Іванович"), f"UI Читач {unique}")
    ui.type_into(ui.by_placeholder("reader@example.com"), email)
    ui.type_into(ui.by_placeholder("••••••••"), password)
    ui.button("Зареєструватися").click()

    ui.wait_url("/login")
    ui.type_into(ui.by_placeholder("reader@example.com"), email)
    ui.type_into(ui.by_placeholder("••••••••"), password)
    ui.button("Увійти").click()

    ui.wait_url("/dashboard")
    ui.text_visible("Мій кабінет читача")
    ui.button("Вийти")


def test_register_duplicate_email_shows_error(ui, reader):
    ui.open("/register")
    ui.type_into(ui.by_placeholder("Іванов Іван Іванович"), "Дублікат")
    ui.type_into(ui.by_placeholder("reader@example.com"), reader["email"])
    ui.type_into(ui.by_placeholder("••••••••"), "Passw0rd-dup")
    ui.button("Зареєструватися").click()

    ui.el(By.CSS_SELECTOR, "div.bg-red-50")
    assert "/register" in ui.driver.current_url


def test_login_with_wrong_password_shows_error(ui, reader):
    ui.open("/login")
    ui.type_into(ui.by_placeholder("reader@example.com"), reader["email"])
    ui.type_into(ui.by_placeholder("••••••••"), "WrongPassword1")
    ui.button("Увійти").click()

    ui.el(By.CSS_SELECTOR, "div.bg-red-100")
    assert "/login" in ui.driver.current_url


def test_logout_returns_to_login(ui, reader):
    ui.login_with_token(reader["token"])
    ui.text_visible("Мій кабінет читача")

    ui.button("Вийти").click()

    ui.wait_url("/login")
    ui.text_visible("Вхід для читачів")


def test_reader_cannot_open_admin_panel(ui, reader):
    ui.login_with_token(reader["token"], "/admin")

    ui.wait_url("/catalog")
    assert not ui.driver.find_elements(By.XPATH, "//a[contains(., 'Панель адміна')]")


def test_librarian_sees_admin_panel(ui, librarian):
    ui.login_with_token(librarian["token"], "/catalog")

    ui.clickable(By.XPATH, "//a[contains(., 'Панель адміна')]").click()

    ui.wait_url("/admin")
    ui.button("Керування книгами")
