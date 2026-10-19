"""FR-2, FR-3: каталог (з нескінченною прокруткою), пошук, фільтр за жанром і деталі книги."""
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select

RESERVE_BUTTONS = "//button[contains(., 'Забронювати книгу')]"


def test_catalog_shows_books_for_guest(ui):
    ui.open("/catalog")

    ui.text_visible("Знайдіть свою наступну книгу")
    cards = ui.wait.until(lambda d: d.find_elements(By.XPATH, RESERVE_BUTTONS))
    assert len(cards) > 0


def test_catalog_loads_more_books_on_scroll(ui, driver):
    """Каталог вантажить по 20 книг; наступна сторінка підвантажується при прокрутці до низу."""
    ui.open("/catalog")
    ui.wait.until(lambda d: len(d.find_elements(By.XPATH, RESERVE_BUTTONS)) == 20)

    driver.execute_script("window.scrollTo(0, document.body.scrollHeight)")

    ui.wait.until(lambda d: len(d.find_elements(By.XPATH, RESERVE_BUTTONS)) > 20)


def test_search_by_title_case_insensitive(ui, book):
    ui.open("/catalog")

    ui.type_into(ui.by_placeholder("Пошук за назвою або автором..."), book["title"].upper())

    # Пошук виконує сервер: лишається тільки знайдена книга
    titles = lambda d: [h.text for h in d.find_elements(By.CSS_SELECTOR, "h3") if h.text.startswith("E2E книга")]
    ui.wait.until(lambda d: titles(d) == [book["title"]])


def test_search_without_results_shows_empty_state(ui):
    ui.open("/catalog")
    ui.text_visible("Знайдіть свою наступну книгу")

    ui.type_into(ui.by_placeholder("Пошук за назвою або автором..."), "zzz-неіснуюча-книга-zzz")

    ui.text_visible("За вашим запитом нічого не знайдено")


def test_filter_by_genre(ui, book):
    ui.open("/catalog")
    select = ui.el(By.TAG_NAME, "select")
    ui.wait.until(lambda d: d.find_elements(By.CSS_SELECTOR, f"select option[value='{book['genre']}']"))

    Select(select).select_by_value(book["genre"])

    genre_badges = "//div[contains(@class,'grid')]//span[contains(@class,'truncate')]"
    ui.wait.until(lambda d: {g.text for g in d.find_elements(By.XPATH, genre_badges)} == {book["genre"]})


def test_book_details_modal_shows_description(ui, book):
    card = ui.find_book(book["title"])

    card.find_element(By.CSS_SELECTOR, "button[title='Деталі книги']").click()

    ui.text_visible("Опис та анотація")
    ui.text_visible(book["description"])
    ui.button("Закрити").click()
