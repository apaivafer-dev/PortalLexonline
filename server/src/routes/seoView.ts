import { Router } from 'express';
import { getDatabase } from '../database/db';

const router = Router();

// Cache object for index.html to minimize self-fetches
const cache = {
    indexHtml: '',
    lastFetch: 0
};

router.get('/:slug/calculorescisaotrabalhista', async (req, res, next) => {
    try {
        const { slug } = req.params;
        const db = await getDatabase();

        // Fetch raw HTML template if not cached or cache is older than 5 minutes
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        let htmlTemplate = cache.indexHtml;
        const now = Date.now();
        if (!htmlTemplate || now - cache.lastFetch > 300000) {
            try {
                // Ensure we get raw firebase hosting index without triggering function loop
                const response = await fetch(`${frontendUrl}/index.html?cachebuster=${now}`);
                if (response.ok) {
                    htmlTemplate = await response.text();
                    cache.indexHtml = htmlTemplate;
                    cache.lastFetch = now;
                } else {
                    throw new Error('Failed to fetch index.html: ' + response.statusText);
                }
            } catch (fetchError) {
                console.error('[SSR] Error fetching base index:', fetchError);
                return next(); // Fallback to passing down
            }
        }

        // Fetch company data
        const calcData = await db.get('SELECT company_name, config FROM published_calculators WHERE slug = ? AND is_active = true', [slug]);
        const user = await db.get('SELECT id FROM users WHERE slug = ?', [slug]);
        let companyProfile = null;
        if (user) {
            companyProfile = await db.get('SELECT * FROM company_profiles WHERE user_id = ?', [user.id]);
        }

        // If no calculator published, return default html to let CSR handle 404 naturally
        if (!calcData) {
            return res.send(htmlTemplate);
        }

        // Prepare variables
        const firmName = companyProfile?.name || calcData.company_name || 'Advocacia Trabalhista';
        const city = companyProfile?.city || 'Sua Cidade';
        const state = companyProfile?.state || 'Brasil';

        const currentUrl = `${frontendUrl}/c/${slug}/calculorescisaotrabalhista`;
        const titleText = `Calculadora de Rescisão Trabalhista Grátis em ${city} - ${firmName}`;
        const descriptionText = `Precisa calcular sua rescisão em ${city}? Acesse a calculadora CLT oficial e saiba exatamente seus direitos na demissão. Simulação rápida e segura por ${firmName}.`;
        const keywordsText = `calculadora de rescisão trabalhista ${city}, cálculo rescisão CLT ${city}, simulador rescisão trabalhista ${city}, advogado do trabalho ${city}, direitos trabalhistas ${city}, rescisão sem justa causa ${city}`;

        const localBusinessSchema = {
            "@context": "https://schema.org",
            "@type": "LegalService",
            "name": firmName,
            "description": `Cálculo de Rescisão Trabalhista e Assessoria Jurídica especializada em ${city} - ${state}`,
            "url": companyProfile?.website || currentUrl,
            "telephone": companyProfile?.phone || "",
            "email": companyProfile?.email || "",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": companyProfile?.street ? `${companyProfile.street}, ${companyProfile.number || ''}` : "",
                "addressLocality": city,
                "addressRegion": state,
                "postalCode": companyProfile?.cep || "",
                "addressCountry": "BR"
            },
            "areaServed": {
                "@type": "City",
                "name": city
            },
            "priceRange": "Consultar"
        };

        const faqs = [
            { question: "O que é o Termo de Rescisão do Contrato de Trabalho?", answer: "O Termo de Rescisão do Contrato de Trabalho (TRCT) é um documento oficial que formaliza o fim do vínculo empregatício. Nele constam todos os valores a serem pagos (verbas rescisórias) e descontos. É essencial para o saque do FGTS e solicitação do Seguro-Desemprego." },
            { question: `Como fazer o cálculo da rescisão de forma exata em ${city}?`, answer: `O cálculo exato exige considerar as convenções coletivas da categoria em ${city}/${state}. Geralmente inclui: saldo de salário, aviso prévio, 13º proporcional, férias + 1/3 e multa do FGTS. Recomenda-se a conferência por um advogado trabalhista local.` },
            { question: "Como calcular a multa de 40% do FGTS?", answer: "A multa de 40% incide sobre o total depositado na conta do FGTS do trabalhador durante todo o contrato, somado aos depósitos da rescisão. O cálculo é: (Saldo Total do FGTS + Depósito Rescisório) x 0,40." },
            { question: "Qual o prazo para pagamento da rescisão?", answer: "Conforme a Reforma Trabalhista (Art. 477 da CLT), o pagamento das verbas rescisórias deve ser efetuado em até 10 dias corridos a partir do término do contrato, independentemente do tipo de aviso prévio." },
            { question: "O que eu perco se pedir demissão?", answer: "Ao pedir demissão, o trabalhador perde o direito à multa de 40% do FGTS, não pode sacar o saldo do FGTS (que fica retido) e não tem direito ao Seguro-Desemprego." }
        ];

        const faqSchema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
            }))
        };

        // Tracking configuration from calcData.config (JSONB field)
        const config = calcData.config || {};
        const { gaCode, adsId, googleAdsId, googleAdsLabel } = config;

        let trackingTags = '';
        const googleId = gaCode || googleAdsId;

        // Base scripts for Google (gtag.js)
        if (googleId) {
            trackingTags += `
            <script async src="https://www.googletagmanager.com/gtag/js?id=${googleId}"></script>
            <script>
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              ${gaCode ? `gtag('config', '${gaCode}');` : ''}
              ${googleAdsId ? `gtag('config', '${googleAdsId}');` : ''}
            </script>`;
        }

        // Base scripts for Meta (Pixel)
        if (adsId) {
            trackingTags += `
            <script>
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${adsId}');
              fbq('track', 'PageView');
            </script>
            <noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${adsId}&ev=PageView&noscript=1" /></noscript>`;
        }

        const seoTags = `
  <title>${titleText}</title>
  <meta name="description" content="${descriptionText}" />
  <meta name="keywords" content="${keywordsText}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${currentUrl}" />
  <meta property="og:title" content="${titleText}" />
  <meta property="og:description" content="${descriptionText}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${currentUrl}" />
  <meta property="og:locale" content="pt_BR" />
  <meta property="og:site_name" content="${firmName}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${titleText}" />
  <meta name="twitter:description" content="${descriptionText}" />
  <script type="application/ld+json">${JSON.stringify(localBusinessSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
  ${trackingTags}
  `;

        // Injection: REPLACE default <title> node and add the rest right there
        let finalHtml = htmlTemplate.replace(/<title>.*?<\/title>/i, seoTags);

        // Invalidate caching explicitly and force removal of lingering CSP
        res.removeHeader('Content-Security-Policy');
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30');
        res.status(200).send(finalHtml + "<!-- cache-buster: " + Date.now() + " -->");
    } catch (error) {
        console.error('[SSR] Error computing SSR route:', error);
        next(error);
    }
});

export default router;
