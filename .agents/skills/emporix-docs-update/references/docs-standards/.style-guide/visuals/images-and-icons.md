---
description: Follow these guidelines for adding image assets to documentation.
icon: image
---

# Images & Icons

## Placing pictures in docs

* Each Gitbook space has its own images path under `.gitbook/assets` folders. Place the image asset in a relevant location and refer to its path in a document using the `<img src="">`
* Wrap images with the `<figure>` tag
* Add `alt` text for description of what the image presents, use a brief phrase.
* Define `<figcaption>` to display the image description in the doc underneath the picture.
* Keep captions concise. A caption names what the image shows. It does not need to list every detail visible in the image or repeat what the surrounding text explains.
* Use colons, semicolons, and dashes in captions only where they are necessary. Prefer a short noun phrase without punctuation.
* Do not use a caption to explain a procedure. Put that in the text.

Example captions:

```
Creating a catalog in Management Dashboard
Order details view
```

Avoid:

```
Order details: the status – Pending; the buttons Approve and Reject; the customer data
```
* Where needed, add `width` param to change the image size on the screen.
* Align images to the center (default behavior).

Example:

```
<figure><img src="../.gitbook/assets/create_catalog.png" alt="Creating a catalog"><figcaption>Creating a catalog in Management Dashboard</figcaption></figure>
```

## Placing icons in docs

* Refer to an icon path using the `<img src="../../.gitbook/assets/orchestration.png" alt="Orchestration icon" data-size="original">` to place it in line with text.
* Do not use `<figcaption>` for icons.

## Editing pictures in PhotoScape

* Frames:
  * Color: #DDE6EE
  * Roundness: 10 (the PhotoScape slider value, **not 10 px**; this is about 4.5% of the shorter side of the image)
  * Stroke: 2/3
* Highlights:
  * Color: #E86C07
  * Shape: Rounded Rectangle
  * Place the frame evenly around the control (button or field). Use about 8–10 px padding on every side — do not hug one edge tighter than another
  * Stroke about 3 px and corner radius about 8 px when drawing outside PhotoScape (docs polish tooling uses these defaults)
* Arrows:
  * Color: #E86C07
* Blur to hide sensitive data
  * Lens blur
  * Strength: 30
  * Brush size: 15
  * Hardness: 25
  * Acceptance: the result must show that content is present but remain unreadable. Prefer mid-gray letter-shaped density. Avoid a milky white wash and avoid a solid dark pill or blackout bar
  * Strength is a PhotoScape slider value, not a pixel blur radius. Do not map Strength 30 to a 30 px Gaussian radius on thin UI text
* More brand colors: [Emporix Style Guide](https://figma.com/design/dAuV0qAntjHxBaypNLd1Os/Emporix-Style-Guide?node-id=23-101\&node-type=frame\&t=TBbRBa6UdWfIFjzk-0).

Example:

<figure><img src="../.gitbook/assets/screenshot_example.png" alt="Example screenshot styling"><figcaption><p>Example screenshot styling</p></figcaption></figure>
