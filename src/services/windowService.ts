export async function startWindowDrag(): Promise<void> {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().startDragging();
  } catch {
    // Browser preview has no native window drag; Tauri provides the real behavior.
  }
}

export async function setClickThrough(enabled: boolean): Promise<void> {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().setIgnoreCursorEvents(enabled);
  } catch {
    // Safe no-op outside the Tauri shell.
  }
}

export async function setAlwaysOnTop(enabled: boolean): Promise<void> {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().setAlwaysOnTop(enabled);
  } catch {
    // Safe no-op outside the Tauri shell.
  }
}

export async function resizePetWindow(mode: 'pet' | 'command'): Promise<void> {
  try {
    const [{ getCurrentWindow }, { LogicalSize }] = await Promise.all([
      import('@tauri-apps/api/window'),
      import('@tauri-apps/api/dpi'),
    ]);
    const size = mode === 'pet' ? new LogicalSize(240, 330) : new LogicalSize(540, 360);
    await getCurrentWindow().setSize(size);
  } catch {
    // Browser preview keeps the CSS layout without native window resizing.
  }
}
