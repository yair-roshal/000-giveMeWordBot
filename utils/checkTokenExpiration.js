const jwt = require('jsonwebtoken')
const logAlerts = require('./logAlerts')

module.exports = function checkTokenExpiration(token, req, res, next) {
    try {
        // Verify the token and get the payload
        // const payload = jwt.verify(token, process.env.JWT_SECRET)
        const payload = jwt.verify(
            token,
            process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
        )

        // Check if the token has expired
        if (payload.exp < Date.now() / 1000) {
            return res
                .status(401)
                .json({ message: 'Authentication token has expired' })
        }

        // Call the next middleware function
        next()
    } catch (err) {
        console.log('err_checkTokenExpiration :>> ', err);
        // logAlerts(err)

         
    }
}
