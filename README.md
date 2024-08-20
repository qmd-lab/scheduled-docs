# Scheduled-docs Extension For Quarto

This set of scripts allows you to schedule the rendering of documents within a Quarto project.

## Installing

``` bash
quarto add qmd-lab/scheduled-docs
```

This will install the scripts under the `_extensions` subdirectory. If you're using version control, you will want to check in this directory.

## Using

Create a new file at the root of your project called `_schedule.yml` and add a `scheduled-docs` key. From here you can list the documents that you would like to schedule along with parameters that determine when they should be rendered. For example:

``` yaml
# _schedule.yml

scheduled-docs:
  draft-after: "system-time"
  timezone: "-07:00"
  docs:
    - href: "posts/post-1.qmd"
      date: 1/1/24
    - href: "posts/post-2.qmd"
      date: 1/3/24
```

The three keys required under `scheduled-docs` are:

-   `draft-after`: can take values either `system-time` or a fixed date in MM/DD/YY format like `1/2/24`. All .qmd files under a `docs` key with a `date` that is in the future relative to `draft-after` will be set to `draft: true`.
-   `timezone`: the offset from GMT in +/-hh:mm. Currently this does not adjust for daylight savings.
-   `docs`: an array of items where each one contains at least an `href` and `date` key. There is considerable flexibility in how you can structure these arrays; see Things to Try number 5 and "Other features \> Schedule yaml file" for details.

## Tutorial

This repository contains an example template of a website that implements `scheduled-docs`. You can install the template using:

``` bash
quarto use template qmd-lab/scheduled-docs
```

### Things to try:

1.  Run `quarto preview` and see how only the first of three posts are visible on the site.

2.  Set `draft-after: "1/4/24"` in `_schedule.yml` and re-render to see how now the first two of the three posts are visible.

3.  Set `draft-after: "system-time"` in `_schedule.yml` and re-render to see how now all three documents are visible. This is because the system time on any computer now will be after 1/5/24.

4.  With `draft-after: "system-time"` add a draft value to the second post as follows:

    ``` yaml
    docs:
      - href: "posts/post-1.qmd"
        date: 1/1/24
      - href: "posts/post-2.qmd"
        date: 1/3/24
        draft: false
      - href: "posts/post-3.qmd"
        date: 1/5/24
    ```

    Re-render the site and observe that now posts 1 and 3 are rendered. This demonstrates that you can manually override the `draft-after` date by hard-coding a draft value of an item (either `true` or `false`).

5.  Comment out the first block of `scheduled-docs` yaml and uncomment the second block of `scheduled-docs`. Re-render the site and observe that the result is the same as in 2). This demonstrates that scheduled documents can be located anywhere under an `scheduled-docs:schedule` array as long as they're in an array called `docs` (and not nested within another `docs` array). This allows you to structure your `scheduled-docs` yaml in a manner that makes sense to you while still taking advantage of the scheduling functionality. See "Other features \> Schedule yaml file" for more info.

## Other features

### Automatic document listings

This extension provides an additional method to specify the contents of a [document listing](https://quarto.org/docs/websites/website-listings.html) on your website. You can flag any subset of documents that you've listed under `docs` to be written into [YAML listing content](https://quarto.org/docs/websites/website-listings.html#yaml-listing-content) by adding a shared `type` value to those documents. For example, this:

```         
docs:
  - href: "posts/post-1.qmd"
    date: 1/1/24
    type: tutorial
  - href: "posts/post-2.qmd"
    date: 1/3/24
    type: tutorial
```

Will lead to the creation of a file called `scheduled-docs_files/tutorial-docs.yml` that looks like:

```         
- path: ../posts/post-1.qmd
- path: ../posts/post-2.qmd
```

You can [add this listing](https://quarto.org/docs/websites/website-listings.html#listing-location) to any page on your website by using the `listing` key in the document yaml and then creating an empty div with the same `id`

```         
---
title: "Listing Example"
listing:
  id: tutorial-listing
  contents: 
    - `scheduled-docs_files/tutorial-docs.yml`
---

Here are the tutorials:

:::{#tutorial-listing}
:::
```

If there are multiple values under `type` (`type: tutorial` and `type: "New updates"`, say), a separate listing file will be created for each one in the same temporary directory with a name structured as `type-contents.yml` (lowercase, dashes instead of spaces) . Here, the contents for `type: "New updates"` would be in `scheduled-docs_files/new-updates-contents.yml`.

If you'd like to flag listing contents using a key other than `type`, change it using the `grouping-label` key under `scheduled-docs`. For example,

```         
scheduled-docs:
  grouping-label: unit
```

### Schedule yaml file

The structured description of the document schedule found in `_schedule.yml` is useful for automatically populating an html version of the schedule for display on a website. For that purpose, this extension writes a separate yaml file to `scheduled-docs_files/schedule.yml` that can be read into an EJS template. [Read the Quarto docs](https://quarto.org/docs/websites/website-listings-custom.html#metadata-file-listings) to learn more about populating an EJS template using a yaml file.

If you supply your documents as a simple array under the `scheduled-docs:docs` key, it is that array that will be written into `scheduled-docs_files/schedule.yml`. Alternatively you can put your `docs` under `scheduled-docs:schedule` as a simple array. Each item in this array can contain either arrays or objects with keys and values, presumably at least one of which is a `docs` array. This flexibility allows you to write a nested schedule that captures all of the information that you'd like to send to `schedule.yml` while still maintaining the scheduled docs functionality for any documents found under a `docs` key. See "Things to try number 5" for an example.

To inspect the structure of the yaml file, add `debug: true` under the `scheduled-docs` key to retain `scheduled-docs_files/schedule.yml` after rendering.

## How it works

The pre-render script reads through `_schedule.yml` and, for every item under `scheduled-docs:docs`, temporarily adds a `draft: true` or `draft: false` field to each depending on whether its `date` is before or after `draft-after`. It then filters to a simple array containing just the `hrefs` where `draft: true` and writes that to `scheduled-docs_files/draft-list.yml`. That file is read in as a `metadata-file` during `quarto render`, which, under the default `draft-mode: gone` will remove the contents from the draft files and ensure they don't appear in listings or search.

The post-render script cleans things up by removing the `scheduled-docs_files` directory. If you run into problems understanding which files are being set to `draft: true`, you can add `debug: true` under the `scheduled-docs` key to retain the `scheduled-docs_files` directory.
