declare module 'otplib' {
    export const authenticator: {
        generateSecret(): string;
        keyuri(email: string, service: string, secret: string): string;
        generate(secret: string): string;
        verify(options: { token: string; secret: string }): boolean;
        check(token: string, secret: string): boolean;
    };
}
