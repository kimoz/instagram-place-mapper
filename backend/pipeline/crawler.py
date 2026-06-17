import os
import time
from dataclasses import dataclass
from typing import List, Optional
from playwright.sync_api import sync_playwright, Page


@dataclass
class RawPost:
    caption: str
    image_url: str
    post_url: str


HASHTAGS_KR = ["성수동맛집", "홍대카페", "연남동", "압구정로데오맛집"]
HASHTAGS_OVERSEAS = ["오사카맛집한국인", "도쿄맛집한국인", "방콕맛집한국인"]


def _login(page: Page) -> None:
    page.goto("https://www.instagram.com/accounts/login/")
    page.wait_for_selector("input[name='username']", timeout=10000)
    page.fill("input[name='username']", os.environ["INSTAGRAM_USERNAME"])
    page.fill("input[name='password']", os.environ["INSTAGRAM_PASSWORD"])
    page.click("button[type='submit']")
    page.wait_for_url("https://www.instagram.com/", timeout=15000)
    time.sleep(2)


def _scrape_hashtag(page: Page, tag: str, max_posts: int = 20) -> List[RawPost]:
    posts: List[RawPost] = []
    page.goto(f"https://www.instagram.com/explore/tags/{tag}/")
    time.sleep(3)

    links = page.query_selector_all("article a")
    post_urls = list({a.get_attribute("href") for a in links if a.get_attribute("href")})[:max_posts]

    failed = 0
    for href in post_urls:
        try:
            page.goto(f"https://www.instagram.com{href}")
            time.sleep(2)
            caption_el = page.query_selector("div[data-testid='post-comment-root'] span")
            caption = caption_el.inner_text() if caption_el else ""
            img_el = page.query_selector("div._aagv img")
            image_url = img_el.get_attribute("src") if img_el else ""
            if caption:
                posts.append(RawPost(
                    caption=caption,
                    image_url=image_url or "",
                    post_url=f"https://www.instagram.com{href}",
                ))
        except Exception:
            failed += 1
            continue
    if failed:
        print(f"[crawler] #{tag}: {len(posts)} posts collected, {failed} errors")
    return posts


def crawl_hashtags(hashtags: Optional[List[str]] = None, max_per_tag: int = 20) -> List[RawPost]:
    if hashtags is None:
        hashtags = HASHTAGS_KR + HASHTAGS_OVERSEAS
    all_posts: List[RawPost] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context(
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
        )
        page = context.new_page()
        _login(page)
        for tag in hashtags:
            posts = _scrape_hashtag(page, tag, max_per_tag)
            all_posts.extend(posts)
            time.sleep(5)
        browser.close()
    return all_posts
