import * as React from 'react';
import GitHubMarkdown from './';

export default {title: 'modules/GitHubMarkdown'};

const markdownString = `<script>alert('You\'ve been hacked')</script>

This is a paragraph.

    This is a paragraph.

\`\`\`typescript
function foo() {
  return 'Hello World';
}
\`\`\`

Header 1
========

Header 2
--------

    Header 1
    ========

    Header 2
    --------



# Header 1
## Header 2
### Header 3
#### Header 4
##### Header 5
###### Header 6

    # Header 1
    ## Header 2
    ### Header 3
    #### Header 4
    ##### Header 5
    ###### Header 6



# Header 1 #
## Header 2 ##
### Header 3 ###
#### Header 4 ####
##### Header 5 #####
###### Header 6 ######

    # Header 1 #
    ## Header 2 ##
    ### Header 3 ###
    #### Header 4 ####
    ##### Header 5 #####
    ###### Header 6 ######



> Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus. Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.

    > Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus. Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.



> ## This is a header.
> 1. This is the first list item.
> 2. This is the second list item.
>
> Here's some example code:
>
>     Markdown.generate();

    > ## This is a header.
    > 1. This is the first list item.
    > 2. This is the second list item.
    >
    > Here's some example code:
    >
    >     Markdown.generate();




- Red
- Green
- Blue


+ Red
+ Green
+ Blue


* Red
* Green
* Blue


\`\`\`markdown
- Red
- Green
- Blue

+ Red
+ Green
+ Blue

* Red
* Green
* Blue
\`\`\`



1. Buy flour and salt
1. Mix together with water
1. Bake

\`\`\`markdown
1. Buy flour and salt
1. Mix together with water
1. Bake
\`\`\`



Paragraph:

    Code

<!-- -->

    Paragraph:

        Code



* * *

***

*****

- - -

---------------------------------------

    * * *

    ***

    *****

    - - -

    ---------------------------------------



This is [an example](http://example.com "Example") link.

[This link](http://example.com) has no title attr.

This is [an example] [id] reference-style link.

[id]: http://example.com "Optional Title"

    This is [an example](http://example.com "Example") link.

    [This link](http://example.com) has no title attr.

    This is [an example] [id] reference-style link.

    [id]: http://example.com "Optional Title"



*single asterisks*

_single underscores_

**double asterisks**

__double underscores__

    *single asterisks*

    _single underscores_

    **double asterisks**

    __double underscores__



This paragraph has some \`code\` in it.

    This paragraph has some \`code\` in it.



![Alt Text](https://get.svg.workers.dev/?s=64&f=gray "Image Title")

    ![Alt Text](https://get.svg.workers.dev/?s=64&f=gray "Image Title")`;

export const Default = () => <GitHubMarkdown>{markdownString}</GitHubMarkdown>;

export const InlineMarkdown = () => (
  <GitHubMarkdown inline>
    {'This is rendered without a **paragraph** tag!'}
  </GitHubMarkdown>
);
