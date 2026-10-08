package com.sliit.marketstore.service.impl;

import com.sliit.marketstore.entity.Company;
import com.sliit.marketstore.exception.ResourceNotFoundException;
import com.sliit.marketstore.repository.CompanyRepository;
import com.sliit.marketstore.service.CompanyService;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CompanyServiceImpl implements CompanyService {
    private final CompanyRepository repository;
    public CompanyServiceImpl(CompanyRepository repository) { this.repository = repository; }
    public List<Company> getAll() { return repository.findAll(); }
    public Company getById(Integer id) { return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Company not found: " + id)); }
    public Company save(Company company) { company.setId(null); return repository.save(company); }
    public Company update(Integer id, Company c) { Company e = getById(id); e.setName(c.getName()); e.setEmail(c.getEmail()); e.setPhone(c.getPhone()); e.setAddress(c.getAddress()); return repository.save(e); }
    public void delete(Integer id) { repository.delete(getById(id)); }
}
