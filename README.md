# Scheduled-docs Extension For Quarto

This set of scripts allows you to schedule the rendering of documents within a Quarto project.

## Installing

``` bash
quarto add qmd-lab/scheduled-docs
```

This will install the scripts under the `_extensions` subdirectory. If you're using version control, you will want to check in this directory.

> Note: in addition to the usage instructions below, you may also need to add `metadata-files: [scheduled-docs_files/draft-list.yml]` to `_quarto.yml`. This will hopefully be fixed in the future. You can track the issue [here](https://github.com/quarto-dev/quarto-cli/issues/10572).

## Using

Create a new file at the root of your project called `_schedule.yml` and add a `scheduled-docs` key. From here you can list the documents that you would like to schedule along with parameters that determine when they should be rendered. For example:

``` yaml
# _schedule.yml

scheduled-docs:
  draft-after: "system-time"
  timezone: "-07:00"
  docs:
    - href: "posts/post-1.qmd"
      date: "2024-01-02"
    - href: "posts/post-2.qmd"
      date: "2024-01-03"
```

The three keys required under `scheduled-docs` are:

-   `draft-after`: can take values either `system-time` or a fixed date in YYYY-MM-DD format like `2024-01-02` (see below for using other date formats). All .qmd files under a `docs` key with a `date` that is in the future relative to `draft-after` will be set to `draft: true`.
-   `timezone`: the offset from GMT in +/-hh:mm. Currently this does not adjust for daylight savings.
-   `docs`: an array of items where each one contains at least an `href` and `date` key. There is considerable flexibility in how you can structure these arrays; see Things to Try number 5 and "Other features \> Schedule yaml file" for details.

### Date formats

By default, the extension assumes dates are formatted in the ISO 8601 standard `yyyy-MM-dd` format (e.g., `2024-08-03` is August 3, 2024). Because of the presence of `-`, this requires the dates be enclosed in quotation marks in the yml file(s).

To use another format, one can set the `date-format` string in `config.yml`. For example, for the standard US format of dates such as `8/3/24`, one would set `date-format: 'M/d/yyyy'`. Note that that should be able to properly handle both four- and two-digit years (e.g., `2024` vs `24`) and one- and two-digit months and days, e.g., `08` and `8`. For a format using `/`, one should not need to enclose the dates in quotation marks in the yml file.

## Tutorial

This repository contains an example template of a website that implements `scheduled-docs`. You can install the template using:

``` bash
quarto use template qmd-lab/scheduled-docs
```

### Things to try:

1.  Run `quarto preview` and see how only the first of three posts are visible on the site.

2.  Set `draft-after: "2024-01-04"` in `_schedule.yml` and re-render to see how now the first two of the three posts are visible.

3.  Set `draft-after: "system-time"` in `_schedule.yml` and re-render to see how now all three documents are visible. This is because the system time on any computer now will be after 1/5/24.

4.  With `draft-after: "system-time"` add a draft value to the second post as follows:

    ``` yaml
    docs:
      - href: "posts/post-1.qmd"
        date: "2024-01-01"
      - href: "posts/post-2.qmd"
        date: "2024-01-03"
        draft: false
      - href: "posts/post-3.qmd"
        date: "2024-01-05"
    ```

    Re-render the site and observe that now posts 1 and 3 are rendered. This demonstrates that you can manually override the `draft-after` date by hard-coding a draft value of an item (either `true` or `false`).

5.  Comment out the first block of `scheduled-docs` yaml and uncomment the second block of `scheduled-docs`. Re-render the site and observe that the result is the same as in 2). This demonstrates that scheduled documents can be located anywhere under an `scheduled-docs:schedule` array as long as they're in an array called `docs` (and not nested within another `docs` array). This allows you to structure your `scheduled-docs` yaml in a manner that makes sense to you while still taking advantage of the scheduling functionality. See "Other features \> Schedule yaml file" for more info.

## Other features

### Automatic document listings

This extension provides an additional method to specify the contents of a [document listing](https://quarto.org/docs/websites/website-listings.html) on your website. You can flag any subset of documents that you've listed under `docs` to be written into [YAML listing content](https://quarto.org/docs/websites/website-listings.html#yaml-listing-content) by adding a shared `type` value to those documents. For example, this:

```         
docs:
  - href: "posts/post-1.qmd"
    date: "2024-01-01"
    type: tutorial
  - href: "posts/post-2.qmd"
    date: "2024-01-03"
    type: tutorial
```

Will lead to the creation of a file called `scheduled-docs_files/tutorial-listing.yml` that looks like:

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
    - `scheduled-docs_files/tutorial-listing.yml`
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

### Automatic Website Navigation

Setting up your scheduled docs requires writing paths to documents that may also be written into the site navigation in `_quarto.yml`. You can save that duplication of effort by utilizing the `autonav` option for either sidebar or hybrid navigation.

#### Sidebar Navigation

In Quarto's [sidebar navigation](https://quarto.org/docs/websites/website-navigation.html#side-navigation), there is a single sidebar that appears on the side of the website to provide links to documents. Instead of typing the structure of this sidebar into `_quarto.yml`, you can add the `sidebar` autonav option in `_schedule.yml`.

```yml
scheduled-docs:
  autonav:
    sidebar:
      type: notes
```

This will create a `scheduled-docs_files/sidebar-contents.yml` file that can then be appended to your `_quarto.yml` with:

```yml
metadata-files:
  - scheduled-docs_files/draft-list.yml
  - scheduled-docs_files/sidebar-contents.yml
```

The `sidebar-contents.yml` file will include all of the `docs` that have `type: notes`. If you have changed the `grouping-label` to `unit` for example (see Automatic Document Listings section), you will use that key instead.

```yml
scheduled-docs:
  autonav:
    sidebar:
      unit: notes
```

If you would like to create sections in your sidebar to organize your documents, you can add a `section-label` option.

```yml
scheduled-docs:
  autonav:
    sidebar:
      type: notes
      section-label: topic
```

This allows you to append an additional key and value to each of your `docs` (in this case, the key `topic`) and then have each doc appear in a sidebar section under its value of the `section-label`.

#### Hybrid Navigation

[Hybrid navigation](https://quarto.org/docs/websites/website-navigation.html#hybrid-navigation) is used on more complex Quarto website where you'd like a different sidebar to appear depending on which part of the website you're in, with each sidebar corresponding to a different item on the top navbar.

```yml
scheduled-docs:
  autonav:
    hybrid:
      - title: Notes
        landing-page: notes.qmd
        type: notes
        section-label: unit
      - title: Labs
        landing-page: labs.qmd
        type: lab
```

This will write a file `scheduled-docs_files/sidebar-contents.yml` that will be formatted to create two sidebars: 1) A sidebar for the `Notes` section of the website with links to all of the docs with `type: notes` (separated into sections by the key `unit`) and 2) A sidebar for the `Labs` section of the website with links to all docs with `type: lab` (with no section separators).

The three necessary keys for each item under `hybrid` are the `title` (which must match the title or `text` of a `navbar` item), a `landing-page` (which will appear as the first item in the sidebar contents), and a `type` of documents to appear in the sidebar.

Hybrid navigation can be tricky to set up, so read the Quarto docs site carefully and add `debug: true` under your `scheduled-docs` key and inspect the files that get written to `scheduled-docs_files`.

To designate one of your docs to be the landing page for a section of the sidebar, add `section-landing-page: true` to that item.

### Schedule yaml file

The structured description of the document schedule found in `_schedule.yml` is useful for automatically populating an html version of the schedule for display on a website. For that purpose, this extension writes a separate yaml file to `scheduled-docs_files/schedule.yml` that can be read into an EJS template. [Read the Quarto docs](https://quarto.org/docs/websites/website-listings-custom.html#metadata-file-listings) to learn more about populating an EJS template using a yaml file.

If you supply your documents as a simple array under the `scheduled-docs:docs` key, it is that array that will be written into `scheduled-docs_files/schedule.yml`. Alternatively you can put your `docs` under `scheduled-docs:schedule` as a simple array. Each item in this array can contain either arrays or objects with keys and values, presumably at least one of which is a `docs` array. This flexibility allows you to write a nested schedule that captures all of the information that you'd like to send to `schedule.yml` while still maintaining the scheduled docs functionality for any documents found under a `docs` key. See "Things to try number 5" for an example.

To inspect the structure of the yaml file, add `debug: true` under the `scheduled-docs` key to retain `scheduled-docs_files/schedule.yml` after rendering.

## How it works

The pre-render script reads through `_schedule.yml` and, for every item under `scheduled-docs:docs`, temporarily adds a `draft: true` or `draft: false` field to each depending on whether its `date` is before or after `draft-after`. It then filters to a simple array containing just the `hrefs` where `draft: true` and writes that to `scheduled-docs_files/draft-list.yml`. That file is read in as a `metadata-file` during `quarto render`, which, under the default `draft-mode: gone` will remove the contents from the draft files and ensure they don't appear in listings or search.

The post-render script cleans things up by removing the `scheduled-docs_files` directory. If you run into problems understanding which files are being set to `draft: true`, you can add `debug: true` under the `scheduled-docs` key to retain the `scheduled-docs_files` directory.
