module.exports = (err, req, res, next) => {
    if (err.name === "CastError" && err.kind === "ObjectId") {
        return res.status(400).json({
            message: "Invalid ID",
        });
    }
    res.status(err.statusCode || 422).json({
        message: err.message || err,
        errorField: "SplitValue",
    });
};
