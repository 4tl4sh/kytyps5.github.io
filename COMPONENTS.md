# Component sources

The frontend is written from scratch. Factual product content and compatibility exports come from [KytyPS5's website repository](https://github.com/kytyPS5/kytyps5.github.io), licensed GPL-2.0 (see LICENSE). The old frontend, layout and styles are not reused.

## 21st.dev exploration and adaptations

Explored the [21st.dev catalog](https://21st.dev/) and [Motion Primitives collection](https://21st.dev/@ibelick/library/motion-primitives). Selected ten small primitives rather than mixing complete page templates. The following are adapted for this design, with accessibility, reduced motion and native scrolling where appropriate:

| Catalog component | Use in this project |
| --- | --- |
| [Animated Background](https://21st.dev/@ibelick/components/animated-background) | Shared-layout sliding navigation highlight, platform tabs, capture selector |
| [Accordion](https://21st.dev/@ibelick/components/accordion) | FAQ and troubleshooting; Radix adds keyboard and disclosure semantics |
| [Carousel](https://21st.dev/@ibelick/components/carousel) | Responsive game collection with native touch scrolling and previous/next controls |
| [Magnetic](https://21st.dev/@ibelick/components/magnetic) | Restrained pointer response on the primary hero action |
| [Text Effect](https://21st.dev/@ibelick/components/text-effect) | Staggered word reveal on the hero and page headings |
| [Animated Number](https://21st.dev/@ibelick/components/animated-number) | Real game, report and repository counts |
| [In View](https://21st.dev/@ibelick/components/in-view) | Progressive section entrances without hiding readable content |
| [Tilt](https://21st.dev/@ibelick/components/tilt) | Interactive game sleeve in the hero |
| [Scroll Progress](https://21st.dev/@ibelick/components/scroll-progress) | Reading-progress line below the site navigation |
| [Transition Panel](https://21st.dev/@ibelick/components/transition-panel) | Platform build instructions and per-OS report transitions |

Original implementations inspected from `https://github.com/ibelick/motion-primitives/tree/main/components/core`. Adaptations are in `src/components/primitives.tsx`, with navigation in `src/App.tsx`.

Motion Primitives is copyright © Julien Thibeaut, MIT License. Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the condition that the above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Imagery

Game sleeves and cover imagery use official PlayStation catalog URLs already associated with those titles in the source database. The art is presented as game artwork, not emulator output. Emulator captures are hotlinked from the original GitHub community report attachments, keeping their original associations. Game status comes from the report, not the image. Contributor avatars and public contribution information come from GitHub. No fabricated performance numbers or user testimonials.
