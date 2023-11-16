exports.splitPayment = (req, res, next) => {
    let { ID, Amount, Currency, CustomerEmail, SplitInfo } = req.body;

    let SplitBreakdown = [];

    Amount = parseFloat(Amount);

    if (SplitInfo.length < 1 || SplitInfo.length > 20) {
        return next(
            new Error(
                "The SplitInfo array can only contain 1-20 entities"
            )
        );
    }

    let trackingObj = {
        Amount: Amount,
        postFlat: Amount,
        postPercent: Amount,
        ratioSum: 0,
        remPercentAccumulator: 1,
        length: SplitInfo.length
    };

    getValue(0, SplitInfo, trackingObj, SplitBreakdown);

    res.status(200).json({
        ID,
        Balance: trackingObj.Amount,
        SplitBreakdown
    });
};

function getValue(index, arr, trackingObj, SplitBreakdown) {
    let x = arr[index];

    let ownPercent = 1;

    let splitType = x.SplitType.toLowerCase();
    let splitValue = parseFloat(x.SplitValue);
    switch (splitType) {
        case "flat": {
            trackingObj.postFlat -= splitValue;

            if (trackingObj.postFlat >= 0) {
                trackingObj.Amount -= splitValue;
                SplitBreakdown.push({
                    SplitEntityId: x["SplitEntityId"],
                    Amount: splitValue,
                });
            } else {
                trackingObj.postFlat += splitValue;
                SplitBreakdown.push({
                    SplitEntityId: x["SplitEntityId"],
                    Amount: 0,
                });
            }
            break;
        }

        case "percentage": {
            ownPercent = splitValue / 100 * trackingObj.remPercentAccumulator;
            trackingObj.remPercentAccumulator *= (100 - splitValue) / 100;
            break;
        }

        case "ratio": {
            trackingObj.ratioSum += splitValue;
            break;
        }
    }

    index += 1;
    if (index == trackingObj.length) {
        trackingObj.postPercent = trackingObj.remPercentAccumulator * trackingObj.postFlat;
    }
    else {
        getValue(index, arr, trackingObj, SplitBreakdown);
    }

    

    switch (splitType) {
        case "flat": {
            return;
        }

        case "percentage": {
            let value = ownPercent * trackingObj.postFlat;
            if (value > 0){
                trackingObj.Amount -= value;
                SplitBreakdown.push({
                    SplitEntityId: x["SplitEntityId"],
                    Amount: value,
                });
            }
            else{
                SplitBreakdown.push({
                    SplitEntityId: x["SplitEntityId"],
                    Amount: 0,
                });
            }
            break;
        }

        case "ratio": {
            let value = splitValue / trackingObj.ratioSum * trackingObj.postPercent;
            if (value > 0){
                trackingObj.Amount -= value;
                SplitBreakdown.push({
                    SplitEntityId: x["SplitEntityId"],
                    Amount: value,
                });
            }
            else{
                SplitBreakdown.push({
                    SplitEntityId: x["SplitEntityId"],
                    Amount: 0,
                });
            }
            break;
        }
    }

    return;
}