package com.sliit.marketstore.controller;

import com.sliit.marketstore.entity.Company;
import com.sliit.marketstore.service.CompanyService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/companies")
public class CompanyController {
    private final CompanyService service;
    public CompanyController(CompanyService service) { this.service = service; }
    @GetMapping public List<Company> all() { return service.getAll(); }
    @GetMapping("/{id}") public Company one(@PathVariable Integer id) { return service.getById(id); }
    @PostMapping public Company add(@RequestBody Company company) { return service.save(company); }
    @PutMapping("/{id}") public Company update(@PathVariable Integer id, @RequestBody Company company) { return service.update(id, company); }
    @DeleteMapping("/{id}") public void delete(@PathVariable Integer id) { service.delete(id); }
}
