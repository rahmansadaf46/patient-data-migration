function getValue(result) {
    return result && result.length > 0 ? result[0].value : '';
}  


module.exports = { getValue };