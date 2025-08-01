import { Fragment, createElement } from "react";

export const SeoTemplate = (arg: { data: any }) => {
  const data = arg.data;
  const site_name = "Esensi.Online";
  const url = `https://esensi.online${data.slug}`;
  const meta_img = data.image
    ? data.image.replace("_file/", "https://esensi.online/_img/")
    : "https://esensi.online/assets/img/logo.png";

  let title_length = 60; //Max title tags length
  let meta_length = 160; // Max meta tags content length
  let meta_page = ``; // Page number text if available
  let product_meta; // JSX to add open graph meta tags for product

  // Check if there's a page number in the URL, and change title and meta length limit
  if (
    data.page &&
    data.page !== "undefined" &&
    data.page !== "null" &&
    data.page > 1
  ) {
    meta_page = ` | Page ${data.page}`;
    title_length = title_length - meta_page.length;
    meta_length = meta_length - meta_page.length;
  }

  // Trim title and meta tags if too long
  let the_title = data.title
    ? data.title
    : data.meta_title
    ? data.meta_title
    : data.headings
    ? data.headings
    : data.h1;
  if (the_title.length > title_length) {
    the_title = the_title.substring(0, title_length) + meta_page;
  }

  let the_desc = data.meta_description
    ? data.meta_description
    : data.description;
  the_desc = the_desc
    .replace(/(<([^>]+)>)/gi, "")
    .replace(`'`, ``)
    .replace(`"`, ``);
  if (the_desc.length > meta_length) {
    the_desc = the_desc.substring(0, meta_length) + meta_page;
  }

  // Cek kalo ada keyword spesifik yang ditentukan (keyword density), kemudian jadikan bold di paragraph
  let the_paragraph = data.paragraph ? data.paragraph : data.description;
  if (
    data?.keywords &&
    data?.keywords !== "undefined" &&
    data?.keywords !== "null"
  ) {
    const the_keywords = data.keywords.replace(`, `, `,`).split(`,`);
    the_keywords.map((keyw: string) => {
      const regex = new RegExp(`\\b${keyw}\\b`, "gi");
      the_paragraph = the_paragraph.replace(regex, `<strong>${keyw}</strong>`);
    });
  }

  // kalo produk atau bundle, masukan open graph meta tags untuk produk
  if (data.is_product) {
    product_meta = (
      <>
        <meta property="og:price:amount" content={data.price} />
        <meta property="og:price:currency" content={data.currency} />
        <meta property="og:product:category" content="eBook" />
      </>
    );
  }

  return (
    <Fragment>
      <html lang="id">
        <head>
          <title>{the_title}</title>
          <meta name="description" content={the_desc} />
          <link rel="canonical" href={url} />
          {/* <link rel="icon" href="" /> */}
          <meta
            property="og:title"
            content={the_title.replace(`'`, ``).replace(`"`, ``)}
          />
          <meta property="og:description" content={the_desc} />
          <meta property="og:image" content={meta_img} />
          <meta property="og:url" content={url} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content={site_name} />
          <meta property="og:locale" content="id_ID" />
          <meta property="og:locale:alternate" content="id_ID" />
          {product_meta}
        </head>
        <body>
          {(() => {
            const headings = [
              { tag: 'h1', content: data?.h1 ? data.h1 : data.headings ? data.headings : data.meta_title },
              { tag: 'h2', content: data?.h2 ? data.h2 : data.headings ? data.headings : data.meta_title },
              { tag: 'h3', content: data?.h3 ? data.h3 : data.headings ? data.headings : data.meta_title },
              { tag: 'h4', content: data?.h4 ? data.h4 : data.headings ? data.headings : data.meta_title },
              { tag: 'h5', content: data?.h5 ? data.h5 : data.headings ? data.headings : data.meta_title },
              { tag: 'h6', content: data?.h6 ? data.h6 : data.headings ? data.headings : data.meta_title }
            ];
            
            const distinctHeadings = [];
            let lastContent = null;
            
            for (const heading of headings) {
              if (heading.content !== lastContent) {
                distinctHeadings.push(heading);
                lastContent = heading.content;
              }
            }
            
            return (
              <>
                {distinctHeadings.map((heading, index) => 
                  createElement(heading.tag, { key: index }, heading.content)
                )}
              </>
            );
          })()}
          <p dangerouslySetInnerHTML={{ __html: the_paragraph }} />
        </body>
      </html>
    </Fragment>
  );
};
