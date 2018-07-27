export class AuthenticationController {

    static async validateJwt(decoded) {
        console.log("validateJwt", decoded);
        return {isValid: !!decoded.user_id};
    }
}