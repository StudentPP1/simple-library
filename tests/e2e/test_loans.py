"""FR-4 – FR-9: бронювання, скасування, видача, повернення та історія читань."""
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC


def test_guest_cannot_reserve(ui, book):
    ui.find_book(book["title"]).find_element(By.XPATH, ".//button[contains(., 'Забронювати книгу')]").click()

    ui.text_visible("Будь ласка, увійдіть в акаунт")


def test_reader_reserves_book_and_sees_it_in_dashboard(ui, reader, book):
    ui.login_with_token(reader["token"], "/catalog")
    card = ui.find_book(book["title"])
    assert "В наявності: 2" in card.text

    card.find_element(By.XPATH, ".//button[contains(., 'Забронювати книгу')]").click()

    ui.text_visible("Книгу успішно заброньовано")
    ui.wait.until(lambda d: "В наявності: 1" in ui.card(book["title"]).text)

    ui.open("/dashboard")
    ui.text_visible(book["title"])
    ui.text_visible("Заброньовано")


def test_reader_cancels_reservation(ui, api, reader, book):
    api.reserve(reader["token"], book["id"])
    ui.login_with_token(reader["token"], "/dashboard")
    ui.text_visible(book["title"])

    ui.button("Скасувати бронь").click()
    ui.wait.until(EC.alert_is_present()).accept()

    ui.text_visible("Бронювання успішно скасовано")
    ui.text_visible("У вас немає активних книг")
    ui.button("Історія").click()
    ui.row(book["title"])
    ui.text_visible("Скасовано")


def test_librarian_issues_and_accepts_return(ui, api, reader, librarian, book):
    api.reserve(reader["token"], book["id"])
    ui.login_with_token(librarian["token"], "/admin")

    ui.button("Активні видачі").click()
    row = ui.row(book["title"])
    assert reader["email"] in row.text
    row.find_element(By.XPATH, ".//button[normalize-space(.)='Видати']").click()

    ui.wait.until(lambda d: "На руках" in ui.row(book["title"]).text)
    ui.row(book["title"]).find_element(By.XPATH, ".//button[contains(., 'Прийняти повернення')]").click()

    ui.wait.until(lambda d: not d.find_elements(By.XPATH, f"//tr[contains(., '{book['title']}')]"))

    ui.login_with_token(reader["token"], "/dashboard")
    ui.button("Історія").click()
    ui.row(book["title"])
    ui.text_visible("Повернено")


def test_issued_book_shows_deadline_in_dashboard(ui, api, reader, librarian, book):
    loan = api.reserve(reader["token"], book["id"])
    api.call("POST", f"/loans/{loan['id']}/issue", {"days": 14}, librarian["token"])

    ui.login_with_token(reader["token"], "/dashboard")

    ui.text_visible("Видано на руки")
    deadline = ui.text_visible("Дедлайн:").text
    assert "Очікує видачі" not in deadline
