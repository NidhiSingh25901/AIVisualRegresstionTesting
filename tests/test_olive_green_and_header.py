from playwright.sync_api import Page, expect

def test_olive_green_color(page: Page):
    page.goto("https://www.automation-bible.com/", wait_until="domcontentloaded", timeout=60000)
    main_container = page.locator("body")
    expect(main_container).to_be_visible()

def test_header_presence(page: Page):
    page.goto("https://www.automation-bible.com/", wait_until="domcontentloaded", timeout=60000)
    header_element = page.get_by_role("heading", name="My Name is Nidhi Singh").first
    expect(header_element).to_be_visible()

def test_header_exact_text(page: Page):
    page.goto("https://www.automation-bible.com/", wait_until="domcontentloaded", timeout=60000)
    header_element = page.get_by_role("heading", name="My Name is Nidhi Singh").first
    expect(header_element).toHaveText("My Name is Nidhi Singh")
