package com.wolfpackunity.gym.auth;

import com.wolfpackunity.gym.auth.dto.AuthResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class GoogleOAuthSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;

    public GoogleOAuthSuccessHandler(AuthService authService) { this.authService = authService; }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest req, HttpServletResponse res,
                                        Authentication auth) throws IOException {
        OAuth2User oauth2User = (OAuth2User) auth.getPrincipal();
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String googleId = oauth2User.getAttribute("sub");

        AuthResponse token = authService.upsertGoogleUser(email, name, googleId);
        getRedirectStrategy().sendRedirect(req, res,
                "http://localhost:5173/oauth2/callback?token=" + token.token());
    }
}
