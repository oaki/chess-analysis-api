export class AuthenticationController {

    static async validateJwt(decoded) {
        return {isValid: !!decoded.user_id};
    }
}
