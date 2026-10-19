"""Нефункціональні вимоги, які перевіряються в кожному браузері (NFR-6, NFR-7, NFR-8)."""
import time

from selenium.webdriver.common.by import By


def test_catalog_loads_under_2_seconds(ui):
    """NFR-8: інтерфейс завантажується не довше 2 с (від запиту сторінки до появи книг)."""
    start = time.perf_counter()
    ui.open("/catalog")
    ui.wait.until(lambda d: d.find_elements(By.XPATH, "//button[contains(., 'Забронювати книгу')]"))
    elapsed = time.perf_counter() - start

    nav = ui.driver.execute_script(
        "const n = performance.getEntriesByType('navigation')[0];"
        "return n ? {dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd} : null;")
    print(f"\n[NFR-8] {ui.driver.capabilities['browserName']}: каталог з книгами за {elapsed * 1000:.0f} мс, "
          f"DOMContentLoaded {nav['dcl']:.0f} мс, load {nav['load']:.0f} мс")
    assert elapsed < 2.0


def test_mobile_layout_uses_burger_menu(ui, driver):
    """NFR-7: на екрані смартфона навігація ховається в меню-«бургер»."""
    driver.set_window_size(390, 844)
    ui.open("/catalog")
    ui.text_visible("Знайдіть свою наступну книгу")

    desktop_nav = driver.find_element(By.CSS_SELECTOR, "header nav")
    assert not desktop_nav.is_displayed()

    ui.clickable(By.CSS_SELECTOR, "header button.md\\:hidden").click()
    ui.el(By.XPATH, "//a[contains(., 'Увійти в систему')]")

    page_width = driver.execute_script("return document.documentElement.scrollWidth")
    viewport = driver.execute_script("return window.innerWidth")
    assert page_width <= viewport, "Сторінка ширша за екран: з'являється горизонтальна прокрутка"
