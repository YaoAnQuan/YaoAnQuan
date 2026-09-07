module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: '仅支持 POST 请求' });
    }

    var apiKey = process.env.API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: '服务端未配置 API_KEY' });
    }

    var body = req.body || {};
    if (body.action === 'health') {
        return res.status(200).json({ ok: true });
    }

    if (!body.messages || !Array.isArray(body.messages)) {
        return res.status(400).json({ error: '请求参数缺少 messages' });
    }

    try {
        var upstream = await fetch('https://www.dmxapi.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: body.model || 'gpt-4o',
                messages: body.messages,
                max_tokens: body.max_tokens || 2048,
                temperature: typeof body.temperature === 'number' ? body.temperature : 0.1,
                response_format: body.response_format || { type: 'json_object' }
            })
        });

        var text = await upstream.text();
        var data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = { error: { message: text || upstream.statusText } };
        }

        return res.status(upstream.status).json(data);
    } catch (error) {
        return res.status(502).json({ error: '无法连接 DMXAPI：' + error.message });
    }
};