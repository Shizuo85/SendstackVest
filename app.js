const express = require("express");

const genError = require("./controllers/errors/errorHandler");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, PATCH"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );
    next();
});

app.use("/split-payments/compute", (req, res, next) => {
    let { ID, Amount, Currency, CustomerEmail, SplitInfo } = req.body;
    SplitInfo = SplitInfo.sort((x, y) => {
        let a = x.SplitType.toUpperCase(),
            b = y.SplitType.toUpperCase();
        return a == b ? 0 : a > b ? 1 : -1;
    });

    let SplitBreakdown = [];
    let ratioPosition = -1;
    arrayLength = SplitInfo.length;
    Amount = parseInt(Amount);

    if (arrayLength < 1 || arrayLength > 20) {
        return next(
            new Error("The SplitInfo array can only contain 1-20 entities")
        );
    }

    for (let i = 0; i < arrayLength; i++) {
        let splitType = SplitInfo[i].SplitType.toLowerCase();
        let splitValue = parseInt(SplitInfo[i].SplitValue);

        if (splitType == "flat") {
            Amount -= splitValue;
            SplitBreakdown.push({
                SplitEntityId: SplitInfo[i]["SplitEntityId"],
                Amount: splitValue,
            });

            if (Amount < 0) {
                return next(
                    new Error(
                        "Excessive Flat Split Value, final Balance cannot be less than 0"
                    )
                );
            }
        } else if (splitType == "percentage") {
            if (splitValue > 100) {
                return next(
                    new Error(
                        "Excessive percentage Split Value, final Balance cannot be less than 0"
                    )
                );
            }
            let x = (splitValue / 100) * Amount;
            SplitBreakdown.push({
                SplitEntityId: SplitInfo[i]["SplitEntityId"],
                Amount: x,
            });

            Amount -= x;
        } else {
            ratioPosition = i;
            break;
        }
    }

    if (ratioPosition != -1) {
        let ratioTotal = SplitInfo.slice(ratioPosition).reduce(
            (total, split) => total + parseInt(split.SplitValue),
            0
        );

        for (let i = ratioPosition; i < arrayLength; i++) {
            let x = (parseInt(SplitInfo[i].SplitValue) / ratioTotal) * Amount;
            SplitBreakdown.push({
                SplitEntityId: SplitInfo[i]["SplitEntityId"],
                Amount: x,
            });
        }
        Amount = 0;
    }

    res.status(200).json({
        ID,
        Balance: Amount,
        SplitBreakdown,
    });
});

app.all("*", (req, res, next) => {
    next(new Error(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(genError);

app.listen(port, () => console.log(`App listening on port ${port}`));
