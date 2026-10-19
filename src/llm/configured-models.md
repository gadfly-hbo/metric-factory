# Fixed standalone model configuration

This is data projected from the installed, fixed @earendil-works/pi-ai 0.87.1
static model metadata; no Pi code or runtime is copied. Source generated module
SHA-256: 220f1c9fad2cb2f62535492b6022e6ee40a8187d1465c2a3aa492f70f6baf6c6.
There are 1,495 entries: 1,175 existing ModelConfig mappings and 320 preserved
unsupported-protocol diagnostics. The existing truth table and explicit gateway
still take precedence. In particular, the old openai-responses to
openai-completions mapping is preserved, not newly endorsed as Provider-tested.

The SDK remains 0.4.3. This data is not a new SDK API or an automatically refreshed
provider registry. Future supplier configuration updates must fix their metadata
source and check the changed resolver behavior. The integration route does not
select these standalone defaults; the host injects its own approved configuration.

Source metadata license, from the versioned upstream file:
https://github.com/earendil-works/pi/blob/v0.87.1/LICENSE

MIT License

Copyright (c) 2025 Mario Zechner

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.