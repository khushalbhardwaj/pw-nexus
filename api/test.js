module.exports = (req, res) => {
    res.json({
        ok: true,
        method: req.method,
        query: req.query,
        headers: req.headers,
        body: req.body
    });
};
