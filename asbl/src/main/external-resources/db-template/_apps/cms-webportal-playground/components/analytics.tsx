import React from "react"

const Analytics = () => (
  <>
    <script
      dangerouslySetInnerHTML={{
        __html: `
    var _paq = _paq || [];
    _paq.push(["trackPageView"]), _paq.push(["enableLinkTracking"]),
    function() {
        _paq.push(["setTrackerUrl", "https://mo.bkstg.flowkraft.com/mgsphbo.php"]);
        _paq.push(["setSiteId", "4"]);
        _paq.push(["disableAlwaysUseSendBeacon", true]);
        var a = document, r = a.createElement("script"), s = a.getElementsByTagName("script")[0];
        r.async = !0, r.defer = !0, r.src = "https://mo.bkstg.flowkraft.com/rsoxaxr.php", s.parentNode.insertBefore(r, s)
    }();
    `,
      }}
    />
    <noscript>
      <img
        src="https://mo.bkstg.flowkraft.com/mgsphbo.php?boj=4&xcz=1"
        alt=""
      />
    </noscript>
  </>
)

export default Analytics
