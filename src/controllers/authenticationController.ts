export class AuthenticationController {

    static async validateJwt(decoded) {
        console.log('validateJwt', decoded);
        if (!decoded.user_id) {
            return {isValid: false};
        }
        else {
            return {isValid: true};
        }
    }
}