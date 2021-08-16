package com.krokodillLl.degree.controllers;

import com.krokodillLl.degree.service.ConnectionService;
import com.krokodillLl.degree.service.Utils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import javax.servlet.http.HttpServletRequest;
import java.util.Set;

@RestController
@RequestMapping("/degree")
public class ConnectionController {

    @Autowired
    private ConnectionService connectionService;

    @PostMapping("/user-connect")
    public ResponseEntity<String> connectUser(HttpServletRequest request, @RequestBody String username) {
        return connectionService.connectUser(request, username);
    }

    @PostMapping("/user-disconnect")
    public ResponseEntity<String> disconnectUser(@RequestBody String username) {
        return connectionService.disconnectUser(username);
    }

    @GetMapping("/active-users")
    public Set<String> getUsers() {
        return connectionService.getUsers();
    }

    @GetMapping("/stickers")
    public Set<String> getStickers() {
        return Utils.getStickers();
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        connectionService.disconnectUser(event);
    }
}
