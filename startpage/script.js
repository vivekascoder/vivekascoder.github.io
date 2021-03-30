// Some JS {Bloated} for startpage.

var query_url = "https://www.google.com/search?q="
var searchEngines = {
    yt: {icon: " ", url: "https://www.youtube.com/results?search_query="},
    g: {icon: " ", url: "https://www.google.com/search?q="},
    gt: {icon: " ", url: "https://github.com/search?q="},
    red: {icon: " ", url: "https://www.reddit.com/search/?q="},
    dj: {icon: " ", url: "https://docs.djangoproject.com/en/3.1/search/?q="},
    py: {icon: " ", url: "https://docs.python.org/3/search.html?q="},
    tw: {icon: " ", url: "https://twitter.com/search?q="},
    arch: {icon: " ", url: "https://wiki.archlinux.org/index.php?search="},
    js: {icon: " ", url: "https://developer.mozilla.org/en-US/search?q="},
}
var search = document.querySelector("#query")
var logo = document.querySelector("#search_logo")
var query = ""

document.addEventListener("keydown", (e) => {
    if (e.code == "Tab") {
        e.preventDefault()
    }
})

document.addEventListener("keyup", (e) => {
    query = search.value
    if (e.code == "Enter") {
        query_url += search.value.replaceAll(" ", "+")
        window.location = query_url
    }
    if (e.code == "Tab") {
        if (Object.keys(searchEngines).find((value) => value == query.slice(1))){
            logo.innerHTML = searchEngines[query.slice(1)].icon
            query_url = searchEngines[query.slice(1)].url
            search.value = ""
        }
    }
})