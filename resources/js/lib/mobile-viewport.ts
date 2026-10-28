/**
 * iOS Safari keeps the layout viewport full-height when the keyboard opens.
 * VisualViewport reports the actual visible area, including keyboard occlusion.
 */
function isTextField(element: Element | null): element is HTMLElement {
    if (!(element instanceof HTMLElement)) return false;
    if (element.isContentEditable) return true;
    if (element instanceof HTMLTextAreaElement) return !element.disabled && !element.readOnly;
    if (element instanceof HTMLInputElement) {
        return !element.disabled && !element.readOnly &&
            !['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'hidden', 'range', 'color'].includes(element.type);
    }
    return false;
}

function caretOrFieldRect(field: HTMLElement): DOMRect {
    if (field.isContentEditable) {
        const selection = window.getSelection();
        if (selection?.rangeCount && field.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0).cloneRange();
            range.collapse(true);
            const caret = range.getClientRects().item(0);
            if (caret && caret.height) return caret;
        }
    }
    return field.getBoundingClientRect();
}

function scrollContainerFor(field: HTMLElement): HTMLElement | null {
    let parent = field.parentElement;
    while (parent && parent !== document.documentElement) {
        const overflow = window.getComputedStyle(parent).overflowY;
        if ((overflow === 'auto' || overflow === 'scroll') && parent.scrollHeight > parent.clientHeight + 2) {
            return parent;
        }
        parent = parent.parentElement;
    }
    return null;
}

function keepFocusedFieldVisible(viewport: VisualViewport): void {
    const field = document.activeElement;
    if (!isTextField(field)) return;

    const container = scrollContainerFor(field);
    const rect = caretOrFieldRect(field);
    const padding = 16;
    let visibleTop = viewport.offsetTop + padding;
    let visibleBottom = viewport.offsetTop + viewport.height - padding;

    if (container) {
        const bounds = container.getBoundingClientRect();
        visibleTop = Math.max(visibleTop, bounds.top + padding);
        visibleBottom = Math.min(visibleBottom, bounds.bottom - padding);
    }

    if (visibleBottom <= visibleTop) return;

    const delta = rect.bottom > visibleBottom
        ? rect.bottom - visibleBottom
        : rect.top < visibleTop ? rect.top - visibleTop : 0;

    if (Math.abs(delta) < 2) return;
    if (container) {
        container.scrollBy({ top: delta, behavior: 'auto' });
    } else {
        window.scrollBy({ top: delta, behavior: 'auto' });
    }
}

export function initMobileViewport(): void {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const root = document.documentElement;
    const mobile = window.matchMedia('(max-width: 767px)');
    let frame = 0;

    const update = () => {
        frame = 0;
        const keyboardOpen = mobile.matches && window.innerHeight - viewport.height > 120;
        root.classList.toggle('mobile-keyboard-open', keyboardOpen);

        if (keyboardOpen) {
            root.style.setProperty('--mobile-visual-top', `${viewport.offsetTop}px`);
            root.style.setProperty('--mobile-visual-height', `${viewport.height}px`);
            root.style.setProperty('--mobile-visual-bottom',
                `${Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height)}px`);
            // Apply the resized panel before measuring the caret inside its scroll area.
            requestAnimationFrame(() => keepFocusedFieldVisible(viewport));
        } else {
            root.style.removeProperty('--mobile-visual-top');
            root.style.removeProperty('--mobile-visual-height');
            root.style.removeProperty('--mobile-visual-bottom');
        }
    };

    const scheduleUpdate = () => {
        if (!frame) frame = requestAnimationFrame(update);
    };

    viewport.addEventListener('resize', scheduleUpdate);
    viewport.addEventListener('scroll', scheduleUpdate);
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('orientationchange', scheduleUpdate);
    document.addEventListener('focusin', (event) => {
        if (!isTextField(event.target instanceof Element ? event.target : null)) return;
        scheduleUpdate();
        // Keyboard animations can finish after focusin, even without a resize event.
        window.setTimeout(scheduleUpdate, 320);
    });
    document.addEventListener('focusout', scheduleUpdate);
    scheduleUpdate();
}
