# Quality Assurance Skill

I guide users through ReportBurster's QA and testing features — validating configurations and ensuring accurate delivery before going live with production distribution.

## Why QA Matters

Before distributing 1,000 payslips or invoices, you need confidence that:
- Email addresses are correct
- PDF attachments generate properly
- Email templates look right
- Variables expand correctly

ReportBurster provides built-in tools to validate everything before actual delivery.

---

## Test Email Server

The safest way to test: a local email server that captures emails without sending them anywhere.

### Starting the Test Email Server
- **Menu Path**: Quality Assurance menu → Start Test Email Server
- **Access URL**: `http://localhost:8025`

### What It Does
- Captures all test emails locally
- Shows email content and formatting
- Displays PDF attachments
- Replicates actual email delivery experience

### Testing Workflow
1. Start Test Email Server
2. Configure ReportBurster to use localhost SMTP
3. Run a burst with test distribution
4. Review captured emails at localhost:8025
5. Verify: recipients, subject, body, attachments
6. When satisfied, switch to production SMTP

---

## Distribution Testing Options

I help users choose the right testing scope:

| Option | Use Case |
|--------|----------|
| **Test all burst tokens** | Full validation before first production run |
| **Test specific tokens** | Comma-separated list for targeted testing |
| **Test random tokens** | Sample-based testing for large reports |

Test emails include:
- Actual PDF attachments
- Real message content (with variables expanded)
- Proper recipient addressing

---

## Error Handling Configuration

### If Any Recipient Delivery Fails

Two strategies:

1. **Stop all document delivery immediately** (Default)
   - Halts entire distribution on first error
   - Best for: critical documents where partial delivery is unacceptable

2. **Continue document delivery for remaining recipients**
   - Skips failed recipients, continues with others
   - Best for: high-volume distribution where some failures are tolerable

### Retry Policy

When a delivery fails, configure automatic retries:

| Setting | Description | Default |
|---------|-------------|---------|
| **Delay** | Initial delay between retries | 3 seconds |
| **Max Delay** | Maximum delay cap | 30 seconds |
| **Max Number of Retries** | Total retry attempts | 3 |

**Exponential backoff**: Each retry doubles the delay (3s → 6s → 12s → ...) until Max Delay is reached.

**Default behavior**: Without retry policy, jobs have one attempt and remain failed until manual intervention.

---

## Quarantine Management

Failed reports are automatically quarantined for review.

### Configuration
- **Menu Path**: `Configuration (My Reports)` → General Settings
- Enable/disable quarantine feature
- Configure quarantine folder location

### What Gets Quarantined
- Reports that failed to deliver
- Reports with invalid email addresses
- Reports that exceeded retry attempts

### Review Process
1. Check quarantine folder for failed documents
2. Analyze error (check logs)
3. Fix the issue (email address, SMTP config, etc.)
4. Manually redistribute corrected reports

---

## Logging & Tracing

### Log Types
- **INFO** — Normal operations, successful deliveries
- **ERROR** — Failed deliveries, configuration issues
- **WARN** — Potential problems, retries triggered

### Log Location
- `logs/errors.log` — Error details
- `logs/reportburster.bat.log` — Execution log (Windows)

### Job Monitoring
- View currently running jobs
- Track progress via status indicators:
  - 🟢 **Green**: All reports distributed successfully
  - 🔴 **Red**: Some reports failed (check quarantine)

### Viewing Logs
- **Menu Path**: Quality Assurance menu → View/Clear log files

---

## Common QA Workflow

1. **Start Test Email Server** — localhost:8025
2. **Configure test SMTP** — point to localhost
3. **Run test distribution** — small sample or all tokens
4. **Review at localhost:8025** — check emails, attachments
5. **Fix issues** — adjust templates, variables, settings
6. **Repeat until clean**
7. **Switch to production SMTP**
8. **Enable retry policy** — for resilience
9. **Configure quarantine** — for failed document recovery
10. **Go live!**

---

## Common Pitfalls

1. **Forgetting to start Test Email Server** — Emails go to real recipients!
2. **Testing with production SMTP** — Always use test server first
3. **No quarantine configured** — Failed documents disappear
4. **Stop-on-first-error in high-volume** — One bad email halts everything
5. **No retry policy** — Transient failures become permanent
6. **Not checking logs** — Missing early warning signs

---

## Documentation Link

- **Quality Assurance**: https://www.reportburster.com/docs/quality-assurance

When I need specifics on error handling options or retry configuration, I fetch this documentation.

---

## My Approach

**Test Before Production** — I always recommend starting with Test Email Server before any live distribution.  
**Appropriate Error Strategy** — I help users choose stop-vs-continue and retry settings based on their use case.  
**Quarantine for Safety Net** — I ensure quarantine is configured so no failed documents are lost.
