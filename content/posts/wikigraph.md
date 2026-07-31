+++
title = "WikiGraph"
description = "Exploring WikiGraph."
date = 2026-07-31

[taxonomies]
tags = ["graph", "project", "obsidian"]
+++

<img src="/img/Screenshot 2026-07-31 at 8.56.23 PM.png"/>

## What?

[WikiGraph](https://wikigraph.vivek.ink) is a wikipedia reader that has support for graph view much like Obsidian including outgoing link, backlinks (not available in wikipedia), and exeternal links. It let's you visualize and find link between new unrelated topics.

I love obsidian, it's graph view, backlinks. I wanted to find how some link emerges between multiple wikipedia pages. So I made a site that just embeds the same graph view in wikipedia, allowing people to view a wikipedia page along with it's outgoing links and backlinks, also the plotting the grand children. To reduce API calls I cached the data, then I tried visualising it and this is how the cache looks like, so far only I've used the site (mostly). This cache visual looks cool. I also added a degree visualisation, inspired from [Six Degrees of Kevin Bacon](https://wikigraph.vivek.ink/?page=Six_Degrees_of_Kevin_Bacon). Thanks to someone from the [reddit post](https://www.reddit.com/r/ObsidianMD/comments/1vbnnnx/plotting_wikipedias_knowledge_graph/).

<center><img src="/img/image.png" alt="cache vis"  width="300"/></center>

The cache keeps growing as people browse more and more pages using the site, more links start to emerge. It feels like it's a pet that keeps growing the more you use it which is kinda cool.

## Why?

I like crime shows, when I came across [Monster](https://www.imdb.com/title/tt13207736/) which is about Ed Gein (a serial killer from 1970s). The last episode i.e [The Godfather](https://www.imdb.com/title/tt38110408/?ref_=tt_epspo_ep_8) was mind boggoling as it linked a bunch of things that was crazy including [Mindhunters](https://en.wikipedia.org/wiki/Mindhunter_(TV_series)), Alfred Hitchcock's The Psycho etc. I was going through Wikipedia and found a bunch of things relate to each other like how [Bates Motel](https://www.imdb.com/title/tt2188671/) is linked to Psycho which is linked to a number of things, the bottom line is a lot of things are connected and sometimes it's amazing to find links between the things that you otherwise would think are unrelated.So I though it would be cool if wikipedia had graph view.

## Tech?
Didn't write anything everything from development -> deployment happend using ChatGPT sites. I was also blown away I didn't run anything in my browser, everyone seem to be moving towards cloud agent and the novelty in how to build seems to be diminishing. It uses Cloudflare D1 SQLite DB under the hood for cache (yes no redis).
