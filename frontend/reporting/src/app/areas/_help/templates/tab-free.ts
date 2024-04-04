export const tabFreeTemplate = `<ng-template #tabFreeTemplate>
  <div class="well">
    <span [innerHTML]="
      'AREAS.HELP.TAB-FREE.INNER-HTML.DO-YOU-WORK' | translate
  "></span>


    <h3>{{
      'AREAS.HELP.TAB-FREE.HOW-TO-APPLY' | translate }}</h3>

    <a href="https://www.reportburster.com/services/free-for-schools/" target="_blank">
      <button class="btn btn-primary" type="button">Get
        <em>ReportBurster</em> {{
        'AREAS.HELP.TAB-FREE.FREE-FOR-SCHOOLS' | translate }}</button>
    </a>

    <br>
    <br>
    <span [innerHTML]="
    'AREAS.HELP.TAB-FREE.INNER-HTML.IN-ORDER-APPLY' | translate"></span>

    <br>
    <br>

    <iframe style="border: none; overflow: hidden;"
      src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FDocumentBurster%2F&amp;tabs&amp;width=500&amp;height=214&amp;small_header=false&amp;adapt_container_width=false&amp;hide_cover=false&amp;show_facepile=true&amp;appId=250210611829648"
      width="600" height="200" frameborder="0" scrolling="no" sandbox="allow-scripts allow-same-origin"></iframe>

    <hr>

    <h3 id='checkPointHelpFreeForSchools' style="text-decoration: underline;">How Schools Use
      <em>ReportBurster</em> Software</h3>
    <em>"At the university we provide reading lists for each course of study. These reading list are provided by the
      course tutors
      and annually we like to feed back to the tutors borrowing figures for the items on the reading lists. We are
      using Crystal
      Reports against an Access database to produce a single PDF per Faculty. DocumentBurster is ideal for splitting
      the large
      Faculty report into individual reports per course tutor and auto-emailing the tutor their own reading lists for
      evaluation.</em>
    <br>
    <br>
    <em>DocumentBurster saves the library staff considerable time and effort whilst proving valuable feedback to
      tutors."</em>
    <br>
    <br>
    <strong>Helen Cooper, Library Application Support Analyst</strong>
    <br>
    <a href="https://www.strath.ac.uk/" target="_blank">University of Strathclyde, Glasgow, United Kingdom</a>
    <br>
    <hr>
    <h3 style="text-decoration: underline;">More
      <em>ReportBurster</em> School Examples</h3>
    <br>1.
    <em>ReportBurster</em> as a general
    <a title="Examples of how people are using DocumentBurster report distribution software"
      href="https://www.pdfburst.com/blog/report-distribution-software/">Report
      Distribution Software</a>
    <a href="https://www.pdfburst.com/blog/report-distribution-software/" target="_blank">
      <button class="btn btn-primary btn-xs" type="button">View Examples</button>
    </a>

    <br>
    <br> 2.
    <a title="Examples of how people are using DocumentBurster to burst and distribute Crystal Reports documents"
      href="https://www.pdfburst.com/blog/crystal-reports-distribution/">Burst
      and Distribute Crystal Reports Documents</a> using
    <em>ReportBurster</em>
    <a href="https://www.pdfburst.com/blog/crystal-reports-distribution/" target="_blank">
      <button class="btn btn-primary btn-xs" type="button">View Examples</button>
    </a>
    <br>
    <br> 3.
    <a title="Examples of how people are using DocumentBurster for emailing payslips to employees"
      href="https://www.pdfburst.com/blog/email-payslips/">Email
      Payslips to Employees</a> using
    <em>ReportBurster</em>
    <a href="https://www.pdfburst.com/blog/email-payslips/" target="_blank">
      <button class="btn btn-primary btn-xs" type="button">View Examples</button>
    </a>

  </div>
</ng-template>
`;
