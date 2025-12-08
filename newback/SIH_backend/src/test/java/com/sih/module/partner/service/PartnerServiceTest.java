package com.sih.module.partner.service;

import com.sih.common.exception.BadRequestException;
import com.sih.module.auth.repository.UserRepository;
import com.sih.module.partner.dto.PartnerRequestDTO;
import com.sih.module.partner.entity.PartnerAccountRequest;
import com.sih.module.partner.repository.PartnerAccountRequestRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PartnerServiceTest {

    @Mock
    private PartnerAccountRequestRepository requestRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PartnerService partnerService;

    @Test
    public void createRequest_Success() {
        PartnerRequestDTO dto = new PartnerRequestDTO();
        dto.setGmailForLogin("test@gmail.com");
        dto.setOfficialOrganizationEmail("org@test.com");
        dto.setContactPersonName("Test User");
        dto.setMobile("1234567890");

        when(requestRepository.findByGmailForLogin(dto.getGmailForLogin())).thenReturn(Optional.empty());
        when(requestRepository.save(any(PartnerAccountRequest.class))).thenAnswer(i -> i.getArguments()[0]);

        PartnerAccountRequest request = partnerService.createRequest(dto);

        Assertions.assertNotNull(request);
        Assertions.assertEquals("PENDING", request.getStatus());
        Assertions.assertEquals("test@gmail.com", request.getGmailForLogin());
    }

    @Test
    public void createRequest_DuplicateEmail_ThrowsException() {
        PartnerRequestDTO dto = new PartnerRequestDTO();
        dto.setGmailForLogin("test@gmail.com");

        when(requestRepository.findByGmailForLogin(dto.getGmailForLogin()))
                .thenReturn(Optional.of(new PartnerAccountRequest()));

        assertThrows(BadRequestException.class, () -> partnerService.createRequest(dto));
    }
}
