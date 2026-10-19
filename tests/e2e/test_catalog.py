"""FR-2, FR-3: каталог, пошук, фільтр за жанром і деталі книги."""
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select


def test_catalog_shows_books_for_guest(ui):
    ui.open("/catalog")

    ui.text_visible("Знайдіть свою наступну книгу")
    cards = ui.wait.until(lambda d: d.find_elements(By.XPATH, "//button[contains(., 'Забронювати книгу')]"))
    assert len(cards) > 0


def test_search_by_title_case_insensitive(ui, book):
    ui.open("/catalog")
    ui.card(book["title"])

    ui.type_into(ui.by_placeholder("Пошук за назвою або автором..."), book["title"].upper())

    ui.card(book["title"])
    titles = [h.text for h in ui.driver.find_elements(By.CSS_SELECTOR, "h3") if h.text.startswith("E2E книга")]
    assert titles == [book["title"]]


def test_search_without_results_shows_empty_state(ui):
    ui.open("/catalog")
    ui.text_visible("Знайдіть свою наступну книгу")

    ui.type_into(ui.by_placeholder("Пошук за назвою або автором..."), "zzz-неіснуюча-книга-zzz")

    ui.text_visible("За вашим запитом нічого не знайдено")


def test_filter_by_genre(ui, book):
    ui.open("/catalog")
    ui.card(book["title"])

    Select(ui.el(By.TAG_NAME, "select")).select_by_value(book["genre"])

    ui.card(book["title"])
    genres = {g.text for g in ui.driver.find_elements(By.XPATH, "//div[contains(@class,'grid')]//span[contains(@class,'truncate')]")}
    assert genres == {book["genre"]}


def test_book_details_modal_shows_description(ui, book):
    ui.open("/catalog")
    card = ui.card(book["title"])

    card.find_element(By.CSS_SELECTOR, "button[title='Деталі книги']").click()

    ui.text_visible("Опис та анотація")
    ui.text_visible(book["description"])
    ui.button("Закрити").click()
