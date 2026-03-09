package com.videostreaming.live.websocket;

import com.videostreaming.auth.service.JwtService;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(JwtHandshakeInterceptor.class);

    private final JwtService jwtService;

    public JwtHandshakeInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {

        String query = request.getURI().getQuery();
        String token = null;

        if (query != null) {
            var params = UriComponentsBuilder.newInstance().query(query).build().getQueryParams();
            token = params.getFirst("token");
        }

        if (token == null || token.isBlank()) {
            logger.warn("WebSocket connection rejected: no token provided");
            return false;
        }

        if (!jwtService.validateToken(token)) {
            logger.warn("WebSocket connection rejected: invalid token");
            return false;
        }

        Claims claims = jwtService.parseToken(token);
        attributes.put("userId", claims.getSubject());
        attributes.put("email", claims.get("email", String.class));
        attributes.put("displayName", claims.get("displayName", String.class));
        attributes.put("role", claims.get("role", String.class));

        logger.info("WebSocket handshake authenticated for user: {} ({})", claims.get("email"), claims.getSubject());
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // No-op
    }
}
