package com.peerprep.microservices.matching.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Lightweight response payload indicating whether the collab session was created successfully. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CollabStartResponse(boolean success, String error) {
}
