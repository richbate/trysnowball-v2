/**
 * Security tests for safe message rendering and ReactMarkdown components
 * Ensures AI content is properly sanitized and CSP-compliant
 */

import { render } from '@testing-library/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { safeRenderMessage, isValidUrl, escapeHtml } from '../safeMessageRenderer';

describe('AI Markdown Security Tests', () => {
  // Test the secure ReactMarkdown configuration
  const SecureMarkdown = ({ content }) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      skipHtml
      components={{
        a: ({href = '', children, ...props}) => {
          const allowProtocols = (url) => /^(https?:|mailto:|tel:)/i.test(url);
          return (
            <a
              href={allowProtocols(href) ? href : '#'}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );

  describe('ReactMarkdown Security (skipHtml + rehype-sanitize)', () => {
    test('blocks inline HTML script tags', () => {
      const maliciousContent = '<script>alert("XSS")</script>Hello world';
      const { container } = render(<SecureMarkdown content={maliciousContent} />);
      
      // Should not contain script tag
      expect(container.innerHTML).not.toContain('<script>');
      expect(container.innerHTML).not.toContain('alert("XSS")');
      // Should still render the safe text
      expect(container.textContent).toContain('Hello world');
    });

    test('blocks onclick handlers in HTML', () => {
      const maliciousContent = '<div onclick="alert(1)">Click me</div>';
      const { container } = render(<SecureMarkdown content={maliciousContent} />);
      
      // Should not contain onclick handler
      expect(container.innerHTML).not.toContain('onclick');
      expect(container.innerHTML).not.toContain('alert(1)');
    });

    test('blocks iframe tags', () => {
      const maliciousContent = '<iframe src="javascript:alert(1)"></iframe>Normal text';
      const { container } = render(<SecureMarkdown content={maliciousContent} />);
      
      expect(container.innerHTML).not.toContain('<iframe>');
      expect(container.innerHTML).not.toContain('javascript:');
      expect(container.textContent).toContain('Normal text');
    });

    test('sanitizes dangerous link protocols', () => {
      const maliciousContent = '[Click me](javascript:alert("XSS"))';
      const { container } = render(<SecureMarkdown content={maliciousContent} />);
      
      const link = container.querySelector('a');
      expect(link).toBeTruthy();
      // Should be replaced with safe fallback
      expect(link.href).toBe('#' || link.href.endsWith('#'));
      expect(link.href).not.toContain('javascript:');
    });

    test('allows safe HTTP/HTTPS links', () => {
      const safeContent = '[Safe link](https://example.com)';
      const { container } = render(<SecureMarkdown content={safeContent} />);
      
      const link = container.querySelector('a');
      expect(link).toBeTruthy();
      expect(link.href).toBe('https://example.com/');
      expect(link.target).toBe('_blank');
      expect(link.rel).toBe('noopener noreferrer');
    });

    test('allows mailto and tel links', () => {
      const content = '[Email](mailto:test@example.com) and [Phone](tel:+1234567890)';
      const { container } = render(<SecureMarkdown content={content} />);
      
      const links = container.querySelectorAll('a');
      expect(links).toHaveLength(2);
      expect(links[0].href).toBe('mailto:test@example.com');
      expect(links[1].href).toBe('tel:+1234567890');
    });
  });

  describe('safeRenderMessage utility', () => {
    test('escapes HTML entities', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      const result = safeRenderMessage(maliciousInput);
      
      expect(result.html).toContain('&lt;script&gt;');
      expect(result.html).not.toContain('<script>');
    });

    test('handles bold markdown safely', () => {
      const input = '**Important** message';
      const result = safeRenderMessage(input);
      
      expect(result.html).toContain('<strong>Important</strong>');
      expect(result.formatted).toBe(true);
    });

    test('validates URLs properly', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
      expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
    });

    test('processes markdown links safely', () => {
      const input = '[Safe](https://example.com) and [Dangerous](javascript:alert(1))';
      const result = safeRenderMessage(input);
      
      expect(result.html).toContain('href="https://example.com"');
      expect(result.html).not.toContain('javascript:alert(1)');
    });
  });

  describe('escapeHtml utility', () => {
    test('escapes all dangerous characters', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(escapeHtml('"onclick"')).toBe('&quot;onclick&quot;');
      expect(escapeHtml("'onload'")).toBe('&#039;onload&#039;');
      expect(escapeHtml('&amp;')).toBe('&amp;amp;');
    });
  });

  describe('AI Response Security Scenarios', () => {
    test('handles malicious AI response with embedded HTML', () => {
      const maliciousAIResponse = `
        Here's your debt plan:
        <script>
          fetch('/api/user/delete', {method: 'POST'});
        </script>
        **Total debt**: £5,000
        <img src="x" onerror="alert('XSS')">
      `;
      
      const { container } = render(<SecureMarkdown content={maliciousAIResponse} />);
      
      expect(container.innerHTML).not.toContain('<script>');
      expect(container.innerHTML).not.toContain('onerror');
      expect(container.innerHTML).not.toContain('fetch(');
      expect(container.textContent).toContain('Total debt');
      expect(container.textContent).toContain('£5,000');
    });

    test('handles AI response with markdown that contains HTML', () => {
      const responseWithHTML = `
        ## Your Debt Strategy
        
        <div class="highlight">This is dangerous</div>
        
        **Action items:**
        1. Pay minimum on all debts
        2. Focus extra payments on <strong>smallest debt</strong>
      `;
      
      const { container } = render(<SecureMarkdown content={responseWithHTML} />);
      
      // HTML should be stripped, markdown should be rendered
      expect(container.innerHTML).not.toContain('<div class="highlight">');
      expect(container.innerHTML).toContain('<h2>');
      expect(container.textContent).toContain('Your Debt Strategy');
      expect(container.textContent).toContain('This is dangerous');
    });
  });
});