# Scheduled-docs Extension For Quarto

This set of scripts allows you to schedule the rendering of documents within a Quarto project.

## Installing

```bash
quarto add qmd-lab/scheduled-docs
```

This will install the scripts under the `_extensions` subdirectory.
If you're using version control, you will want to check in this directory.

## Using

To use this extension, start by adding the following three fields to your `_quarto.yml` file.

```yaml
project:
  type: website
  pre-render:                                         # add
    - "_extensions/qmd-lab/scheduled-docs/write-draftlist.ts" # all
  post-render:                                        # of
    - "_extensions/qmd-lab/scheduled-docs/rm-draftlist.ts"    # these
metadata-files:                                       # lines
  - "scheduled-docs_files/draft-list.yml"             # please
```
Once you've done that, you can now add a new key called `scheduled-docs` to your `_quarto.yml` where you can list the documents that you would like to schedule along with parameters that determine when they should be rendered. For example:

```yaml
# somewhere in your _quarto.yml ...

scheduled-docs:
  draft-after: "system-time"
  timezone: "-07:00"
  docs:
    - href: "posts/post-1.qmd"
      date: 1/1/24
    - href: "posts/post-2.qmd"
      date: 1/3/24
```
The three keys recognized under `scheduled-docs` are:

- `draft-after`: can take values either `system-time` or a fixed date in MM/DD/YY format like `1/2/24`. All .qmd files under a `docs` key with a `date` that is in the future relative to `draft-after` will be set to `draft: true`.
- `timezone`: the offset from GMT in +/-hh:mm. Currently this does not adjust for daylight savings.
- `docs`: an array of items where each one contains at least an `href` and `date` key. There is considerable flexibility in how you can structure these arrays; see the example.

## How it works

The pre-render script reads through `_quarto.yml` and, for every item under `scheduled-docs:docs`, temporarily adds a `draft: true` or `draft: false` field to each depending on whether its `date` is before or after `draft-after`. It then filters to a simple array containing just the `hrefs` where `draft: true` and writes that to `scheduled-docs_files/draft-list.yml`. That file is read in as a `metadata-file` during `quarto render`, which, under the default `draft-mode: gone` will remove the contents from the draft files and ensure they don't appear in listings or search.

The post-render script cleans things up by removing the `scheduled-docs_files` directory. If you run into problems understanding which files are being set to `draft: true`, you can add `debug: true` under the `scheduled-docs` key to retain the `scheduled-docs_files` directory.

## Example

This repository contains an example template of a website that implements `scheduled-docs`. You can install the template using:

```bash
quarto use template qmd-lab/scheduled-docs
```

Things to try:

1. Run `quarto preview` and see how only the first of three posts are visible on the site.
2. Set `draft-after: "1/4/24"` in `_quarto.yml` and re-render to see how now the first two of the three posts are visible.
3. Set `draft-after: "system-time"` in `_quarto.yml` and re-render to see how now all three documents are visible. This is because the system time on any computer now will be after 1/5/24.
4. With `draft-after: "system-time"` add a draft value to the second post as follows:
   
   ```yaml
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
5. Comment out the first block of `scheduled-docs` yaml and uncomment the second block of `scheduled-docs`. Re-render the site and observe that the result is the same as in 2). This demonstrates that scheduled documents can be located anywhere under `scheduled-docs` as long as they're in an array called `docs` (and not nested within another `docs` array). This allows you to structure your `scheduled-docs` yaml in a manner that makes sense to you while still taking advantage of the scheduling functionality.
