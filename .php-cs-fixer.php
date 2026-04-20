<?php

declare(strict_types=1);

$finder = PhpCsFixer\Finder::create()
    ->in(__DIR__)
    ->exclude(['vendor', 'node_modules', 'app', 'tests'])
    ->name('*.php');

return (new PhpCsFixer\Config())
    ->setRules([
        '@PSR12'                        => true,
        'array_syntax'                  => ['syntax' => 'short'],
        'binary_operator_spaces'        => ['default' => 'single_space'],
        'blank_line_after_namespace'    => true,
        'blank_line_after_opening_tag'  => true,
        'blank_line_before_statement'   => ['statements' => ['return']],
        'cast_spaces'                   => ['space' => 'single'],
        'class_attributes_separation'   => ['elements' => ['method' => 'one']],
        'concat_space'                  => ['spacing' => 'one'],
        'declare_strict_types'          => false,  // WordPress doesn't use strict_types globally
        'no_unused_imports'             => true,
        'no_whitespace_in_blank_line'   => true,
        'ordered_imports'               => ['sort_algorithm' => 'alpha'],
        'single_quote'                  => true,
        'trailing_comma_in_multiline'   => ['elements' => ['arrays']],
        'trim_array_spaces'             => true,
    ])
    ->setFinder($finder)
    ->setUsingCache(true)
    ->setCacheFile(__DIR__ . '/.php-cs-fixer.cache');
