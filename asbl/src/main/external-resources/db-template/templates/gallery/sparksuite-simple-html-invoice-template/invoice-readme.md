# A Modern, Clean, and Very Simple Responsive HTML Invoice Template

A modern, clean, and very simple responsive HTML invoice template, because sometimes you just need something quick and simple.

- Simple design
- Responsive
- Easily customizable
- RTL support

## Printer-friendly Styling

By default, the appearance of the invoice when printed is the same as when viewed on a screen. If the invoice is the primary or only element on the page, you may want to consider removing the box-shadow and border, and letting the invoice extend the full width of the page. That can be accomplished with this CSS:

```css
@media print {
  .invoice-box {
    max-width: unset;
    box-shadow: none;
    border: 0px;
  }
}
```

## RTL Support

Replace

```html
<div class="invoice-box"></div>
```

with

```html
<div class="invoice-box rtl"></div>
```
