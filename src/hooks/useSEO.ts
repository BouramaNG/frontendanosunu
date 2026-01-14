import { useEffect } from 'react';

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  author?: string;
}

/**
 * Hook pour optimiser le SEO de chaque page
 * Met à jour dynamiquement les meta tags, title, et OpenGraph
 * 
 * @example
 * useSEO({
 *   title: 'Chambres Noires | AnoSUNU',
 *   description: 'Discussions anonymes...',
 *   keywords: 'politique, psychologie, chambres noires'
 * })
 */
export function useSEO(config: SEOConfig) {
  useEffect(() => {
    // Update document title
    document.title = config.title;

    // Update meta description
    updateMetaTag('name', 'description', config.description);

    // Update keywords if provided
    if (config.keywords) {
      updateMetaTag('name', 'keywords', config.keywords);
    }

    // Update author if provided
    if (config.author) {
      updateMetaTag('name', 'author', config.author);
    }

    // Update Open Graph tags
    updateMetaTag('property', 'og:title', config.title);
    updateMetaTag('property', 'og:description', config.description);
    
    if (config.ogType) {
      updateMetaTag('property', 'og:type', config.ogType);
    } else {
      updateMetaTag('property', 'og:type', 'website');
    }

    if (config.ogImage) {
      updateMetaTag('property', 'og:image', config.ogImage);
    } else {
      updateMetaTag('property', 'og:image', 'https://anosunu.com/logo.svg');
    }

    // Update Twitter Card tags
    updateMetaTag('name', 'twitter:title', config.title);
    updateMetaTag('name', 'twitter:description', config.description);

    if (config.ogImage) {
      updateMetaTag('name', 'twitter:image', config.ogImage);
    } else {
      updateMetaTag('name', 'twitter:image', 'https://anosunu.com/logo.svg');
    }

    // Update canonical URL
    const canonicalUrl = config.canonicalUrl || window.location.href;
    updateCanonicalTag(canonicalUrl);

    // Update current page URL in Open Graph
    updateMetaTag('property', 'og:url', canonicalUrl);
    updateMetaTag('name', 'twitter:url', canonicalUrl);
  }, [config]);
}

/**
 * Helper function to update or create meta tags
 */
function updateMetaTag(
  attribute: 'name' | 'property',
  content: string,
  value: string
) {
  let metaTag = document.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${content}"]`
  );

  if (!metaTag) {
    // Create new meta tag if it doesn't exist
    metaTag = document.createElement('meta');
    metaTag.setAttribute(attribute, content);
    document.head.appendChild(metaTag);
  }

  metaTag.content = value;
}

/**
 * Helper function to update canonical URL
 */
function updateCanonicalTag(url: string) {
  let canonicalTag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!canonicalTag) {
    canonicalTag = document.createElement('link');
    canonicalTag.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalTag);
  }

  canonicalTag.href = url;
}

/**
 * Hook to update JSON-LD schema dynamically
 * @example
 * useSEOSchema({
 *   "@type": "BreadcrumbList",
 *   "itemListElement": [...]
 * })
 */
export function useSEOSchema(schema: Record<string, any>, id: string = 'page-schema') {
  useEffect(() => {
    let scriptTag = document.getElementById(id) as HTMLScriptElement | null;

    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.type = 'application/ld+json';
      scriptTag.id = id;
      document.head.appendChild(scriptTag);
    }

    scriptTag.textContent = JSON.stringify(schema);
  }, [schema, id]);
}
