// Accessibility Testing Utilities
// Provides automated accessibility checks and testing helpers

export interface AccessibilityIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  rule: string;
  description: string;
  element?: HTMLElement;
  selector?: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagCriterion: string;
  suggestion: string;
}

export interface AccessibilityTestResult {
  passed: boolean;
  issues: AccessibilityIssue[];
  score: number; // 0-100
  testedElements: number;
  timestamp: Date;
}

class AccessibilityTester {
  private issues: AccessibilityIssue[] = [];
  private testedElements = 0;

  public async runTests(container?: HTMLElement): Promise<AccessibilityTestResult> {
    this.issues = [];
    this.testedElements = 0;

    const root = container || document.body;
    
    // Run all accessibility tests
    await Promise.all([
      this.testColorContrast(root),
      this.testKeyboardNavigation(root),
      this.testAriaLabels(root),
      this.testHeadingStructure(root),
      this.testFocusManagement(root),
      this.testImageAltText(root),
      this.testFormLabels(root),
      this.testLinkPurpose(root),
      this.testTouchTargets(root),
      this.testMotionPreferences(root),
      this.testScreenReaderSupport(root),
    ]);

    const score = this.calculateScore();
    
    return {
      passed: this.issues.filter(issue => issue.severity === 'error').length === 0,
      issues: this.issues,
      score,
      testedElements: this.testedElements,
      timestamp: new Date(),
    };
  }

  private async testColorContrast(root: HTMLElement): Promise<void> {
    const elements = root.querySelectorAll('*');
    
    elements.forEach((element) => {
      if (element instanceof HTMLElement) {
        this.testedElements++;
        
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        
        // Skip if no text content
        if (!element.textContent?.trim()) return;
        
        // Check if element has sufficient contrast
        const contrast = this.calculateContrast(color, backgroundColor);
        
        if (contrast < 4.5) {
          this.addIssue({
            id: `contrast-${this.issues.length}`,
            severity: contrast < 3 ? 'error' : 'warning',
            rule: 'color-contrast',
            description: `Insufficient color contrast ratio: ${contrast.toFixed(2)}:1`,
            element,
            wcagLevel: 'AA',
            wcagCriterion: '1.4.3',
            suggestion: 'Increase contrast between text and background colors to at least 4.5:1 for normal text or 3:1 for large text.',
          });
        }
      }
    });
  }

  private async testKeyboardNavigation(root: HTMLElement): Promise<void> {
    const interactiveElements = root.querySelectorAll(
      'button, a, input, select, textarea, [tabindex], [role="button"], [role="link"]'
    );

    interactiveElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        this.testedElements++;
        
        // Check if element is focusable
        const tabIndex = element.getAttribute('tabindex');
        const isFocusable = element.tabIndex >= 0 || 
          ['button', 'a', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase());
        
        if (!isFocusable && tabIndex !== '-1') {
          this.addIssue({
            id: `keyboard-nav-${this.issues.length}`,
            severity: 'error',
            rule: 'keyboard-navigation',
            description: 'Interactive element is not keyboard accessible',
            element,
            wcagLevel: 'A',
            wcagCriterion: '2.1.1',
            suggestion: 'Ensure all interactive elements are keyboard accessible with proper tabindex values.',
          });
        }

        // Check for visible focus indicators
        const styles = window.getComputedStyle(element, ':focus');
        const outline = styles.outline;
        const outlineWidth = styles.outlineWidth;
        
        if (outline === 'none' || outlineWidth === '0px') {
          this.addIssue({
            id: `focus-indicator-${this.issues.length}`,
            severity: 'warning',
            rule: 'focus-indicators',
            description: 'Element lacks visible focus indicator',
            element,
            wcagLevel: 'AA',
            wcagCriterion: '2.4.7',
            suggestion: 'Add visible focus indicators using CSS :focus styles.',
          });
        }
      }
    });
  }

  private async testAriaLabels(root: HTMLElement): Promise<void> {
    const elementsNeedingLabels = root.querySelectorAll(
      'button:not([aria-label]):not([aria-labelledby]), input:not([aria-label]):not([aria-labelledby]), [role="button"]:not([aria-label]):not([aria-labelledby])'
    );

    elementsNeedingLabels.forEach((element) => {
      if (element instanceof HTMLElement) {
        this.testedElements++;
        
        // Check if element has accessible name
        const hasLabel = element.getAttribute('aria-label') ||
          element.getAttribute('aria-labelledby') ||
          element.textContent?.trim() ||
          (element as HTMLInputElement).labels?.length > 0;

        if (!hasLabel) {
          this.addIssue({
            id: `aria-label-${this.issues.length}`,
            severity: 'error',
            rule: 'aria-labels',
            description: 'Interactive element lacks accessible name',
            element,
            wcagLevel: 'A',
            wcagCriterion: '4.1.2',
            suggestion: 'Add aria-label, aria-labelledby, or visible text to provide an accessible name.',
          });
        }
      }
    });
  }

  private async testHeadingStructure(root: HTMLElement): Promise<void> {
    const headings = Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let previousLevel = 0;

    headings.forEach((heading, index) => {
      if (heading instanceof HTMLElement) {
        this.testedElements++;
        
        const level = parseInt(heading.tagName.charAt(1));
        
        // Check for proper heading hierarchy
        if (index === 0 && level !== 1) {
          this.addIssue({
            id: `heading-structure-${this.issues.length}`,
            severity: 'warning',
            rule: 'heading-structure',
            description: 'Page should start with h1 heading',
            element: heading,
            wcagLevel: 'AA',
            wcagCriterion: '1.3.1',
            suggestion: 'Start page with h1 and maintain proper heading hierarchy.',
          });
        }
        
        if (level > previousLevel + 1) {
          this.addIssue({
            id: `heading-hierarchy-${this.issues.length}`,
            severity: 'warning',
            rule: 'heading-hierarchy',
            description: `Heading level skipped from h${previousLevel} to h${level}`,
            element: heading,
            wcagLevel: 'AA',
            wcagCriterion: '1.3.1',
            suggestion: 'Maintain proper heading hierarchy without skipping levels.',
          });
        }
        
        previousLevel = level;
      }
    });
  }

  private async testTouchTargets(root: HTMLElement): Promise<void> {
    const touchTargets = root.querySelectorAll('button, a, input, [role="button"], [role="link"]');

    touchTargets.forEach((element) => {
      if (element instanceof HTMLElement) {
        this.testedElements++;
        
        const rect = element.getBoundingClientRect();
        const minSize = 44; // WCAG recommended minimum
        
        if (rect.width < minSize || rect.height < minSize) {
          this.addIssue({
            id: `touch-target-${this.issues.length}`,
            severity: 'warning',
            rule: 'touch-targets',
            description: `Touch target too small: ${rect.width}x${rect.height}px`,
            element,
            wcagLevel: 'AAA',
            wcagCriterion: '2.5.5',
            suggestion: 'Ensure touch targets are at least 44x44 pixels for better accessibility.',
          });
        }
      }
    });
  }

  private async testMotionPreferences(root: HTMLElement): Promise<void> {
    const animatedElements = root.querySelectorAll('[style*="animation"], [class*="animate"]');
    
    animatedElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        this.testedElements++;
        
        const styles = window.getComputedStyle(element);
        const animation = styles.animation;
        
        if (animation && animation !== 'none') {
          // Check if reduced motion is respected
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          
          if (prefersReducedMotion) {
            this.addIssue({
              id: `motion-preference-${this.issues.length}`,
              severity: 'warning',
              rule: 'motion-preferences',
              description: 'Animation not respecting reduced motion preference',
              element,
              wcagLevel: 'AAA',
              wcagCriterion: '2.3.3',
              suggestion: 'Respect prefers-reduced-motion media query to disable animations.',
            });
          }
        }
      }
    });
  }

  private async testImageAltText(root: HTMLElement): Promise<void> {
    const images = root.querySelectorAll('img');
    
    images.forEach((img) => {
      this.testedElements++;
      
      const alt = img.getAttribute('alt');
      const role = img.getAttribute('role');
      
      if (alt === null && role !== 'presentation') {
        this.addIssue({
          id: `img-alt-${this.issues.length}`,
          severity: 'error',
          rule: 'image-alt',
          description: 'Image missing alt attribute',
          element: img,
          wcagLevel: 'A',
          wcagCriterion: '1.1.1',
          suggestion: 'Add descriptive alt text or role="presentation" for decorative images.',
        });
      }
    });
  }

  private async testFormLabels(root: HTMLElement): Promise<void> {
    const formControls = root.querySelectorAll('input, select, textarea');
    
    formControls.forEach((control) => {
      if (control instanceof HTMLElement) {
        this.testedElements++;
        
        const id = control.id;
        const label = id ? root.querySelector(`label[for="${id}"]`) : null;
        const ariaLabel = control.getAttribute('aria-label');
        const ariaLabelledby = control.getAttribute('aria-labelledby');
        
        if (!label && !ariaLabel && !ariaLabelledby) {
          this.addIssue({
            id: `form-label-${this.issues.length}`,
            severity: 'error',
            rule: 'form-labels',
            description: 'Form control missing label',
            element: control,
            wcagLevel: 'A',
            wcagCriterion: '3.3.2',
            suggestion: 'Associate form controls with labels using for/id, aria-label, or aria-labelledby.',
          });
        }
      }
    });
  }

  private async testLinkPurpose(root: HTMLElement): Promise<void> {
    const links = root.querySelectorAll('a[href]');
    
    links.forEach((link) => {
      if (link instanceof HTMLElement) {
        this.testedElements++;
        
        const text = link.textContent?.trim();
        const ariaLabel = link.getAttribute('aria-label');
        
        const linkText = ariaLabel || text;
        
        if (!linkText || linkText.length < 3) {
          this.addIssue({
            id: `link-purpose-${this.issues.length}`,
            severity: 'warning',
            rule: 'link-purpose',
            description: 'Link text is not descriptive',
            element: link,
            wcagLevel: 'A',
            wcagCriterion: '2.4.4',
            suggestion: 'Provide descriptive link text that explains the link purpose.',
          });
        }
      }
    });
  }

  private async testFocusManagement(root: HTMLElement): Promise<void> {
    // Test for focus traps in modals
    const modals = root.querySelectorAll('[role="dialog"], [role="alertdialog"]');
    
    modals.forEach((modal) => {
      if (modal instanceof HTMLElement) {
        this.testedElements++;
        
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) {
          this.addIssue({
            id: `focus-management-${this.issues.length}`,
            severity: 'error',
            rule: 'focus-management',
            description: 'Modal dialog has no focusable elements',
            element: modal,
            wcagLevel: 'A',
            wcagCriterion: '2.1.2',
            suggestion: 'Ensure modal dialogs contain focusable elements and manage focus properly.',
          });
        }
      }
    });
  }

  private async testScreenReaderSupport(root: HTMLElement): Promise<void> {
    // Test for live regions
    const liveRegions = root.querySelectorAll('[aria-live]');
    
    if (liveRegions.length === 0) {
      this.addIssue({
        id: `screen-reader-${this.issues.length}`,
        severity: 'info',
        rule: 'screen-reader-support',
        description: 'No live regions found for dynamic content announcements',
        wcagLevel: 'AA',
        wcagCriterion: '4.1.3',
        suggestion: 'Consider adding aria-live regions for dynamic content updates.',
      });
    }
  }

  private calculateContrast(color1: string, color2: string): number {
    // Simplified contrast calculation
    // In a real implementation, you'd use a proper color contrast library
    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);
    
    if (!rgb1 || !rgb2) return 21; // Assume good contrast if can't parse
    
    const l1 = this.getLuminance(rgb1);
    const l2 = this.getLuminance(rgb2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  private parseColor(color: string): [number, number, number] | null {
    // Simplified color parsing - in reality you'd use a proper color library
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    return null;
  }

  private getLuminance([r, g, b]: [number, number, number]): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  private addIssue(issue: AccessibilityIssue): void {
    this.issues.push(issue);
  }

  private calculateScore(): number {
    const totalIssues = this.issues.length;
    const errorWeight = 10;
    const warningWeight = 5;
    const infoWeight = 1;
    
    const weightedIssues = this.issues.reduce((sum, issue) => {
      switch (issue.severity) {
        case 'error': return sum + errorWeight;
        case 'warning': return sum + warningWeight;
        case 'info': return sum + infoWeight;
        default: return sum;
      }
    }, 0);
    
    const maxPossibleScore = this.testedElements * errorWeight;
    const score = Math.max(0, 100 - (weightedIssues / maxPossibleScore) * 100);
    
    return Math.round(score);
  }
}

// Export singleton instance
export const accessibilityTester = new AccessibilityTester();

// Utility functions for testing
export function testAccessibility(container?: HTMLElement): Promise<AccessibilityTestResult> {
  return accessibilityTester.runTests(container);
}

export function generateAccessibilityReport(result: AccessibilityTestResult): string {
  const { passed, issues, score, testedElements, timestamp } = result;
  
  let report = `# Accessibility Test Report\n\n`;
  report += `**Generated:** ${timestamp.toLocaleString()}\n`;
  report += `**Score:** ${score}/100\n`;
  report += `**Status:** ${passed ? 'PASSED' : 'FAILED'}\n`;
  report += `**Elements Tested:** ${testedElements}\n\n`;
  
  if (issues.length === 0) {
    report += `✅ No accessibility issues found!\n`;
  } else {
    report += `## Issues Found (${issues.length})\n\n`;
    
    const errorIssues = issues.filter(i => i.severity === 'error');
    const warningIssues = issues.filter(i => i.severity === 'warning');
    const infoIssues = issues.filter(i => i.severity === 'info');
    
    if (errorIssues.length > 0) {
      report += `### ❌ Errors (${errorIssues.length})\n\n`;
      errorIssues.forEach(issue => {
        report += `- **${issue.rule}** (WCAG ${issue.wcagLevel} ${issue.wcagCriterion}): ${issue.description}\n`;
        report += `  *Suggestion:* ${issue.suggestion}\n\n`;
      });
    }
    
    if (warningIssues.length > 0) {
      report += `### ⚠️ Warnings (${warningIssues.length})\n\n`;
      warningIssues.forEach(issue => {
        report += `- **${issue.rule}** (WCAG ${issue.wcagLevel} ${issue.wcagCriterion}): ${issue.description}\n`;
        report += `  *Suggestion:* ${issue.suggestion}\n\n`;
      });
    }
    
    if (infoIssues.length > 0) {
      report += `### ℹ️ Information (${infoIssues.length})\n\n`;
      infoIssues.forEach(issue => {
        report += `- **${issue.rule}** (WCAG ${issue.wcagLevel} ${issue.wcagCriterion}): ${issue.description}\n`;
        report += `  *Suggestion:* ${issue.suggestion}\n\n`;
      });
    }
  }
  
  return report;
}