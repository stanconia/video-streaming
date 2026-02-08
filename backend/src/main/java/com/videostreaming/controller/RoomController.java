package com.videostreaming.controller;

import com.videostreaming.model.Participant;
import com.videostreaming.model.Room;
import com.videostreaming.model.dto.CreateRoomRequest;
import com.videostreaming.model.dto.JoinRoomRequest;
import com.videostreaming.service.RoomService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public ResponseEntity<Room> createRoom(@RequestBody CreateRoomRequest request) {
        Room room = roomService.createRoom(request.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(room);
    }

    @GetMapping
    public ResponseEntity<List<Room>> getAllRooms() {
        List<Room> rooms = roomService.getAllActiveRooms();
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<Room> getRoom(@PathVariable String roomId) {
        return roomService.getRoomById(roomId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<Void> deleteRoom(@PathVariable String roomId) {
        roomService.deleteRoom(roomId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{roomId}/participants")
    public ResponseEntity<List<Participant>> getParticipants(@PathVariable String roomId) {
        List<Participant> participants = roomService.getParticipants(roomId);
        return ResponseEntity.ok(participants);
    }
}
