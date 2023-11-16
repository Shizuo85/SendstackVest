exports.splitPayment = (req, res, next) => {
    let { ID, Amount, Currency, CustomerEmail, SplitInfo } = req.body;
    SplitInfo = SplitInfo.sort((x, y) => {
        const a = x.SplitType.toUpperCase(),
            b = y.SplitType.toUpperCase();
        return a == b ? 0 : a > b ? 1 : -1;
    });

    const SplitBreakdown = [];
    let ratioTotal = 0;
    const arrayLength = SplitInfo.length;
    Amount = parseInt(Amount);

    if (arrayLength < 1 || arrayLength > 20) {
        return next(
            new Error("The SplitInfo array can only contain 1-20 entities")
        );
    }

    const ratioArray = SplitInfo.filter((SplitInfo) => {
        const splitType = SplitInfo.SplitType.toLowerCase();
        const splitValue = parseInt(SplitInfo.SplitValue);

        if (splitType == "flat") {
            Amount -= splitValue;
            SplitBreakdown.push({
                SplitEntityId: SplitInfo["SplitEntityId"],
                Amount: splitValue,
            });

            if (Amount < 0) {
                throw new Error(
                    "Excessive Flat Split Value, final Balance cannot be less than 0"
                );
            }
        } else if (splitType == "percentage") {
            if (splitValue > 100) {
                throw new Error(
                    "Excessive percentage Split Value, final Balance cannot be less than 0"
                );
            }
            const x = (splitValue / 100) * Amount;
            SplitBreakdown.push({
                SplitEntityId: SplitInfo["SplitEntityId"],
                Amount: x,
            });

            Amount -= x;
        } else {
            ratioTotal += splitValue;
            return true;
        }
        return false;
    });

    if (ratioArray.length != 0) {
        ratioArray.every((SplitInfo) => {
            const x = (parseInt(SplitInfo.SplitValue) / ratioTotal) * Amount;
            SplitBreakdown.push({
                SplitEntityId: SplitInfo["SplitEntityId"],
                Amount: x,
            });
            return true;
        });
        Amount = 0;
    }

    res.status(200).json({
        ID,
        Balance: Amount,
        SplitBreakdown,
    });
};
