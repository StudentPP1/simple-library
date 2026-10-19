"""FR-6, FR-7: бібліотекар додає та редагує книги через панель."""
from selenium.webdriver.common.by import By


def test_librarian_adds_book(ui, librarian, unique):
    title = f"E2E книга UI {unique}"
    ui.login_with_token(librarian["token"], "/admin")

    ui.type_into(ui.by_placeholder("Clean Architecture"), title)
    ui.type_into(ui.by_placeholder("Роберт Мартін"), "Selenium Автор")
    ui.type_into(ui.by_placeholder("Програмування"), "E2E")
    ui.type_into(ui.by_placeholder("978-0134494166"), "978-0000000002")
    ui.button("Додати у фонд").click()

    ui.row(title)
    ui.find_book(title)


def test_librarian_edits_book(ui, librarian, book):
    new_title = book["title"] + " (ред.)"
    ui.login_with_token(librarian["token"], "/admin")

    ui.row(book["title"]).find_element(By.CSS_SELECTOR, "button[title='Редагувати']").click()
    ui.text_visible("Редагувати книгу")
    ui.type_into(ui.by_placeholder("Clean Architecture"), new_title)
    ui.button("Зберегти зміни").click()

    ui.row(new_title)
