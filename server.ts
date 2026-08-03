import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'PreçoJusto' });
  });

  // Gemini AI receipt parser endpoint
  app.post('/api/parse-receipt', async (req, res) => {
    try {
      const { imageBase64, textContent } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({
          error: 'Chave do Gemini (GEMINI_API_KEY) não configurada.',
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Você é um assistente de extração de dados de notas fiscais de supermercados e farmácias do Brasil (NFC-e / Danfe).
Extraia os dados estruturados do cupom/comprovante fornecido.
Retorne ESTRITAMENTE um JSON válido com a seguinte estrutura de tipos sem markdown nem formatações extras:
{
  "estabelecimento": "Nome do Mercado ou Farmácia",
  "cnpj": "XX.XXX.XXX/XXXX-XX",
  "cidade": "Cidade",
  "bairro": "Bairro ou Centro",
  "data": "YYYY-MM-DD",
  "total": 0.00,
  "itens": [
    {
      "nome": "Nome do Produto",
      "preco": 0.00,
      "quantidade": 1,
      "unidade": "un | kg | g | L | ml | pct | cx",
      "categoria": "Mercearia | Hortifruti | Carnes e Aves | Laticínios e Frios | Bebidas | Mat. Limpeza | Higiene e Perfumaria | Farmácia e Medicamentos | Outros"
    }
  ]
}`;

      let responseText = '';

      if (imageBase64) {
        // Strip data prefix if present
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            prompt,
            {
              inlineData: {
                data: cleanBase64,
                mimeType: 'image/jpeg',
              },
            },
          ],
        });
        responseText = response.text || '';
      } else if (textContent) {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [prompt, textContent],
        });
        responseText = response.text || '';
      } else {
        return res.status(400).json({ error: 'Nenhuma imagem ou texto fornecido' });
      }

      // Clean JSON markers if present
      const cleanJson = responseText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsedData = JSON.parse(cleanJson);
      return res.json({ success: true, data: parsedData });
    } catch (err: any) {
      console.error('Erro ao processar cupom com Gemini:', err);
      return res.status(500).json({
        error: 'Não foi possível extrair automaticamente os dados da foto da nota.',
        details: err?.message || String(err),
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor PreçoJusto rodando na porta ${PORT}`);
  });
}

startServer();
