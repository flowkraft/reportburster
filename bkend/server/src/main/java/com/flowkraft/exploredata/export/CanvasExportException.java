package com.flowkraft.exploredata.export;

/**
 * Thrown by {@link ScriptAssembler} when the assembled Groovy dispatcher
 * script fails the pre-write compile check.
 *
 * {@link #widgetId} carries the ID of the responsible widget (when the error
 * line can be mapped back to a specific widget block) so the UI can highlight
 * exactly which widget caused the problem.
 */
public class CanvasExportException extends RuntimeException {

    /** Widget ID blamed for the compile error, or {@code null} if unknown. */
    public final String widgetId;

    public CanvasExportException(String message, String widgetId) {
        super(message);
        this.widgetId = widgetId;
    }

    public CanvasExportException(String message) {
        super(message);
        this.widgetId = null;
    }
}
