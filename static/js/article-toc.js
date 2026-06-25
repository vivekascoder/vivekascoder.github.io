(function () {
    const articleBody = document.querySelector("article .body");

    if (!articleBody) {
        return;
    }

    const headings = Array.from(articleBody.querySelectorAll("h1, h2, h3, h4, h5, h6"))
        .map((element) => {
            const clone = element.cloneNode(true);
            clone.querySelectorAll(".heading-anchor, .zola-anchor, a[aria-label]").forEach((anchor) => {
                anchor.remove();
            });

            return {
                element,
                id: element.id,
                level: Number(element.tagName.slice(1)),
                text: clone.textContent.trim().replace(/\s+/g, " "),
            };
        })
        .filter((heading) => heading.id && heading.text);

    if (headings.length < 2) {
        return;
    }

    const minLevel = Math.min(...headings.map((heading) => heading.level));
    const toc = document.createElement("nav");
    toc.className = "article-toc";
    toc.setAttribute("aria-label", "Article table of contents");

    const mini = document.createElement("div");
    mini.className = "article-toc-mini";

    const list = document.createElement("div");
    list.className = "article-toc-list";

    headings.forEach((heading, index) => {
        const miniLink = document.createElement("a");
        miniLink.className = "article-toc-mini-link";
        miniLink.href = "#" + heading.id;
        miniLink.setAttribute("aria-label", heading.text);
        miniLink.dataset.tocIndex = String(index);
        mini.appendChild(miniLink);

        const link = document.createElement("a");
        link.className = "article-toc-link article-toc-level-" + Math.min(heading.level - minLevel + 1, 5);
        link.href = "#" + heading.id;
        link.textContent = heading.text;
        link.title = heading.text;
        link.dataset.tocIndex = String(index);
        list.appendChild(link);
    });

    toc.append(mini, list);
    document.body.appendChild(toc);

    function scrollToHeading(event) {
        const link = event.target.closest("a[href^='#']");

        if (!link) {
            return;
        }

        const index = Number(link.dataset.tocIndex);
        const heading = headings[index];

        if (!heading) {
            return;
        }

        event.preventDefault();

        const header = document.querySelector("header");
        const stickyOffset = header ? header.getBoundingClientRect().height + 16 : 16;
        const top = heading.element.getBoundingClientRect().top + window.scrollY - stickyOffset;

        window.scrollTo({ top, behavior: "smooth" });
        history.pushState(null, "", "#" + heading.id);
    }

    function setActive(index) {
        toc.querySelectorAll("[data-toc-index]").forEach((link) => {
            link.classList.toggle("is-active", Number(link.dataset.tocIndex) === index);
        });
    }

    function updateActiveHeading() {
        const header = document.querySelector("header");
        const stickyOffset = header ? header.getBoundingClientRect().height + 24 : 24;
        let activeIndex = 0;

        headings.forEach((heading, index) => {
            const top = heading.element.getBoundingClientRect().top;

            if (top <= stickyOffset) {
                activeIndex = index;
            }
        });

        setActive(activeIndex);
    }

    let frameRequested = false;

    function requestActiveUpdate() {
        if (frameRequested) {
            return;
        }

        frameRequested = true;
        window.requestAnimationFrame(() => {
            updateActiveHeading();
            frameRequested = false;
        });
    }

    toc.addEventListener("click", scrollToHeading);
    window.addEventListener("scroll", requestActiveUpdate, { passive: true });
    window.addEventListener("resize", requestActiveUpdate);
    updateActiveHeading();
})();
